import { Job } from "bullmq";
import RedisConnection from './redisConnection';
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

// Worker creation to process jobs in the inferenceQueue
new Worker('inferenceQueue', processContents, { connection: redisConnection });

module.exports = {inferenceQueue, inferenceQueueEvents};

