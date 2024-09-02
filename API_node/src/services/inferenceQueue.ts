import { Job } from "bullmq";
import RedisConnection from '../utils/redisConnection';
import DatasetDAO from "../dao/datasetDao";
import { Dataset } from "../models/sequelize_model/Dataset";
import { checkTokenAvailability, updateTokenBalance } from "./tokenManagementService";
import ResultDAO from "../dao/resultDao";
import { BullJobStatus, JobStatus } from "../models/job";
import { sequelize } from '../config/sequelize';
import { ApplicationError, ErrorFactory, ErrorType, InsufficientTokensError} from "../utils/errorFactory";
const { Queue, Worker, QueueEvents } = require('bullmq');
import { sendMessageToUser } from '../websocket/websocketServer'; // Importa la funzione per inviare messaggi agli utenti specifici
import { sendUserMessage, MessageType } from '../websocket/websocketMessages'

// Getting the Redis connection instance 
const redisConnection = RedisConnection.getInstance();

// Queue creation
const inferenceQueue = new Queue('inferenceQueue', { connection: redisConnection });
// QueueEvent Creation
const inferenceQueueEvents = new QueueEvents('inferenceQueueEvents', { connection: redisConnection });
// Route address to perform object detection
const FLASK_PREDICTION_URL = process.env.FLASK_PREDICTION_URL || 'http://flask:5000/predict';

// Definition of the function used by the worker to process jobs
const processContents: Function = async (job: Job) => {

  // Retrieve the dataset informations
  const dataset: Dataset | null = await DatasetDAO.getDatasetByName(job.data.datasetName, job.data.userEmail);
  if (!dataset) {
    throw ErrorFactory.createError(ErrorType.DatasetNotFound); // Throw error if dataset not found
  }
  // Checks if the user has enough tokens to perform the inference on the dataset
  if (!await checkTokenAvailability(job.data.userEmail, dataset.token_cost)) {
    throw ErrorFactory.createError(ErrorType.InsufficientTokens, "Unsufficient tokens to process job " + job.id);
  }

  // Use a managed transaction
  await sequelize.transaction(async (transaction) => {
    // Update token balance with the transaction
    await updateTokenBalance(job.data.userEmail, dataset.token_cost, transaction);

    try {
      // Send inference request to the Flask API
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

      // Check if the response is not ok ( status 4xx or 5xx)
      if (!response.ok) {
        throw ErrorFactory.createError(ErrorType.InferenceError);
      }

      // Parse the response data and stores the job result in the db
      const responseData = await response.json();
      ResultDAO.updateJobResult(job.id!, JSON.stringify(responseData));

    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      } else {
        throw ErrorFactory.createError(ErrorType.Generic, "An error occurred while processing the job");
      }
    }
  });
}

// Worker creation to process jobs in the inferenceQueue
const worker = new Worker('inferenceQueue', processContents, { connection: redisConnection });
  
// Listener for the 'active' event
worker.on(BullJobStatus.Active, async (job: any) => {
  //aggiornamento dello stato del job nel db
  ResultDAO.updateJobStatus(job.id, JobStatus.Running);

  // Invia un messaggio di notifica all'utente che il job è stato preso in carico
  const userEmail = job.data.userEmail;
  sendUserMessage(userEmail, MessageType.JobActive, { userEmail, jobId: job.id });
  });
 

// Listener for the 'completed' event
worker.on(BullJobStatus.Completed, async (job: any) => {
  ResultDAO.updateJobStatus(job.id, JobStatus.Completed);
  const userEmail = job.data.userEmail; 
  sendUserMessage(userEmail, MessageType.JobCompleted, { userEmail, jobId: job.id });
});

// Listener for the 'failed' event
worker.on(BullJobStatus.Failed, async (job: any, error: any) => {
  // Check the error type 
  if (error instanceof InsufficientTokensError) {
    ResultDAO.updateJobStatus(job.id!, JobStatus.Aborted);
    const userEmail = job.data.userEmail;
    sendUserMessage(userEmail, MessageType.JobAborted, { userEmail, jobId: job.id });
   
  } else {
    ResultDAO.updateJobStatus(job.id, JobStatus.Failed);
    const userEmail = job.data.userEmail;
    sendUserMessage(userEmail, MessageType.JobFailed, { userEmail, jobId: job.id });
  }
});

// Listener for the 'waiting' event
worker.on(BullJobStatus.Waiting, async (jobId: string) => {

});

// Listener for the 'removed' event
worker.on(BullJobStatus.Removed, async (jobId: string) => {
  //aggiornamento dello stato del job nel db
  ResultDAO.updateJobStatus(jobId, JobStatus.Aborted);
});

module.exports = { inferenceQueue, inferenceQueueEvents };

