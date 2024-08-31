import { Job } from "bullmq";
import RedisConnection from './redisConnection';
import DatasetDAO from "../dao/datasetDao";
import { Dataset } from "../models/sequelize_model/Dataset";
import { checkTokenAvailability } from "./tokenManagementService";
import ResultDAO from "../dao/resultDao";
import { BullJobStatus, JobStatus } from "../models/job";
import UserDAO from "../dao/userDao";
import sequelize from '../config/sequelize';
const { Queue, Worker, QueueEvents } = require('bullmq');


// Getting the Redis connection instance 
const redisConnection = RedisConnection.getInstance();

// Queue creation
const inferenceQueue = new Queue('inferenceQueue', { connection: redisConnection });
// QueueEvent Creation
const inferenceQueueEvents = new QueueEvents('inferenceQueueEvents', { connection: redisConnection });
// Route address to perform object detection
const FLASK_PREDICTION_URL = /*process.env.FLASK_PREDICTION_URL ||*/ 'http://flask:5000/predict'; 

// Definition of the function used by the worker to process jobs
const processContents: Function = async (job: Job) => {

  try {
    // Retrieve the dataset informations
    const dataset: Dataset = await DatasetDAO.getDatasetByName(job.data.datasetName, job.data.userEmail);

    // Checks if the user has enough tokens to perform the inference on the dataset
    if (!await checkTokenAvailability(job.data.userEmail, -dataset.token_cost)) {
      console.log("Token insufficienti");
      ResultDAO.updateJobStatus(job.id!, JobStatus.Aborted);
      return;
    }

    console.log("Token sufficienti");

    // Utilizza una managed transaction
    await sequelize.transaction(async (transaction) => {
      // Aggiorna il saldo dei token con la transazione
      await UserDAO.updateTokenBalanceByEmail(job.data.userEmail, dataset.token_cost, transaction);

      // Invia la richiesta di inferenza all'API Flask
      const response = await fetch(FLASK_PREDICTION_URL, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataset_id: dataset.dataset_id,
          job_id: job.id,
          model_id: job.data.modelId,
          model_version: job.data.modelVersion
        }),
      });

      const responseData = await response.json();
      console.log("responseData: " + JSON.stringify(responseData));

      ResultDAO.updateJobResult(job.id!, JSON.stringify(responseData));

      if (!response.ok) {
        throw new Error(responseData.message);
      }
    });
  } catch (error: any) {
    console.log(error);
  }

}

// Worker creation to process jobs in the inferenceQueue
const worker = new Worker('inferenceQueue', processContents, { connection: redisConnection });

// Listener for the 'active' event
worker.on(BullJobStatus.Active, async (job: any) => {
  console.log("job " + job.id + " preso in carico");
  //aggiornamento dello stato del job nel db
  ResultDAO.updateJobStatus(job.id, JobStatus.Running);
});

// Listener for the 'completed' event
worker.on(BullJobStatus.Completed, async (job: any) => {
  console.log("job " + job.id + " completato");
  //aggiornamento dello stato del job nel db
  ResultDAO.updateJobStatus(job.id, JobStatus.Completed);
});

// Listener for the 'failed' event
worker.on(BullJobStatus.Failed, async (job: any, err:any) => {
  console.log("job " + job.id + " fallito");
  //aggiornamento dello stato del job nel db
  ResultDAO.updateJobStatus(job.id, JobStatus.Failed);
});

// Listener for the 'waiting' event
worker.on(BullJobStatus.Waiting, async (jobId: string) => {
  
});

// Listener for the 'removed' event
worker.on(BullJobStatus.Removed, async (jobId: string) => {
  console.log("job " + jobId + " rimosso");
  //aggiornamento dello stato del job nel db
  ResultDAO.updateJobStatus(jobId, JobStatus.Aborted);
});

module.exports = {inferenceQueue, inferenceQueueEvents};

