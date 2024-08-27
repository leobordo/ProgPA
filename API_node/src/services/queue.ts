import { Job } from "bullmq";
import RedisConnection from './redisConnection';
import DatasetDAO from "../dao/datasetDao";
import { Dataset } from "../models/sequelize_model/Dataset";
import { checkTokenAvailability } from "./tokenManagementService";
import ResultDAO from "../dao/resultDao";
import { JobStatus } from "../models/job";
import UserDAO from "../dao/userDao";
import { Utente } from "../models/sequelize_model/Utente";
import { Err } from "joi";
const { Queue, Worker, QueueEvents } = require('bullmq');
const IORedis = require('ioredis');

// Getting the Redis connection instance 
const redisConnection = RedisConnection.getInstance();

// Queue creation
const inferenceQueue = new Queue('inferenceQueue', { connection: redisConnection });
// QueueEvent Creation
const inferenceQueueEvents = new QueueEvents('inferenceQueueEvents', { connection: redisConnection });
// Route address to perform object detection
const FLASK_PREDICTION_URL = process.env.FLASK_PREDICTION_URL || 'http://localhost:5000/prediction'; 

// Definition of the function used by the worker to process jobs
const processContents:Function = async (job: Job) => {
  
  //Retrieve the dataset informations
  const dataset:Dataset = await DatasetDAO.getDatasetByName(job.data.dataset_name, job.data.user);

  //Checks if the user has enough tokens to perform the inference on the dataset
  if (await checkTokenAvailability(job.data.user, -dataset.token_cost)) {

    //Update token balance
    UserDAO.updateTokenBalanceByEmail(job.data.user, dataset.token_cost)

    //Sends the inference request to the flask API
    await fetch(FLASK_PREDICTION_URL, {
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
  } 
  // if the user hasn't enough tokens to perform the inference on the dataset, 
  // update the job status to aborted
  else {
    if (job.id) {ResultDAO.updateJobStatus(job.id, JobStatus.Aborted);}
  }

}

// Worker creation to process jobs in the inferenceQueue
new Worker('inferenceQueue', processContents, { connection: redisConnection });

// Listener for the 'active' event
inferenceQueueEvents.on('active', async (event:any) => {
  //aggiornamento dello stato del job nel db
  ResultDAO.updateJobStatus(event.jobId, JobStatus.Running);
});

// Listener for the 'completed' event
inferenceQueueEvents.on('completed', async (event:any) => {
  //aggiornamento dello stato del job nel db
  ResultDAO.updateJobStatus(event.jobId, JobStatus.Completed);
});

// Listener for the 'failed' event
inferenceQueueEvents.on('failed', async (event:any) => {
  try {
    //Rimborso dei crediti
    const dataset: Dataset = await DatasetDAO.getDatasetByJobId(event.jobId);
    const user: Utente = await UserDAO.getUserByEmail(dataset.email);
    const newTokenBalance = user.tokens + dataset.token_cost;
    await UserDAO.updateTokenBalanceByEmail(user.email, newTokenBalance);
    //aggiornamento dello stato del job nel db
    ResultDAO.updateJobStatus(event.jobId, JobStatus.Failed);
  } catch (error) {
    throw Error("");
  }
});

module.exports = {inferenceQueue, inferenceQueueEvents};

