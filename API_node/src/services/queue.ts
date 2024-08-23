import { Job } from "bullmq";
import RedisConnection from './redisConnection';
import DatasetDAO from "../dao/datasetDao";
import { Dataset } from "../models/sequelize_model/Dataset";
import { checkTokenAvailability } from "./tokenManagementService";
import ResultDAO from "../dao/resultDao";
import { JobStatus } from "../models/job";
import UserDAO from "../dao/userDao";
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
  const dataset:Dataset = await DatasetDAO.getDatasetByName(job.data.datasetName, job.data.user);

  //Checks if the user has enough tokens to perform the inference on the dataset
  if (await checkTokenAvailability(job.data.user, -dataset.tokenCost)) {

    //Update token balance
    UserDAO.updateTokenBalance(job.data.user, dataset.tokenCost)

    //Sends the inference request to the flask API
    const response = await fetch(FLASK_PREDICTION_URL, {
      method: "POST",
      headers: { 
        'Content-Type': 'application/json', 
      },
      body: JSON.stringify({ 
          datasetName: job.data.datasetName, 
          user: job.data.user, 
          model_id: job.data.modelId, 
          model_version: job.data.modelVersion  
      }),
    });
    const data = await response.json();
    return data;
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
  //Rimborso dei crediti
  //UserDAO.updateTokenBalance( , dataset.tokenCost)
  //aggiornamento dello stato del job nel db
  ResultDAO.updateJobStatus(event.jobId, JobStatus.Failed);
});

module.exports = {inferenceQueue, inferenceQueueEvents};

