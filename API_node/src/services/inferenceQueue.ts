/**
 * @fileoverview This module defines a Singleton service class for managing inference jobs in a queue system using BullMQ.
 */
import { Job, Queue, Worker, QueueEvents } from 'bullmq';  // Import classes for managing queues and workers.
import RedisConnection from '../utils/redisConnection';    // Utility for managing Redis connections.
import DatasetDAO from "../dao/datasetDao";                // Data access object for datasets.
import { Dataset } from "../models/sequelize_model/Dataset";  // Sequelize model for datasets.
import { checkTokenAvailability, updateTokenBalance } from "./tokenManagementService";  // Service functions for token management.
import ResultDAO from "../dao/resultDao";                  // Data access object for job results.
import { BullJobStatus, JobStatus } from "../models/job";  // Types and enums for job status management.
import { sequelize } from '../config/sequelize';           // Sequelize configuration and management.
import { ApplicationError, ErrorFactory, ErrorType, InsufficientTokensError } from "../utils/errorFactory";  // Error handling utilities.
import { sendUserMessage, MessageType } from '../websocket/websocketMessages';  // WebSocket messaging utilities.
import { ModelId } from '../models/aiModels';  // Type definition for AI model identifiers.

/**
 * @class InferenceQueueService is responsible for managing the queue of inference jobs using BullMQ
 * backed by Redis. This service handles the detailed aspects of job queuing, processing, and
 * notifying users of job progress or completion.
 *
 * This service encapsulates the entire queue management logic including:
 * - Setting up and maintaining a queue for inference jobs.
 * - Creating workers to process jobs added to the queue.
 * - Handling job lifecycle events such as job completion, failure, or updates.
 * - Interacting with the Flask API to perform the inference.
 * - Managing errors and exceptions that arise during the job processing, including transaction management
 *   and rollback in case of failures.
 *
 * It also provides:
 * - A method to add jobs to the queue, ensuring that they are processed in order (a FIFO policy is used).
 * - Event listeners that update the job status in the database and inform users connected via websockets 
 *   about status changes of their jobs.
 *
 * The InferenceQueueService follows a singleton pattern to ensure that there is a single central manager
 * of all queue-related operations.
 */
class InferenceQueueService {
  private static instance: InferenceQueueService;  // Singleton instance of the InferenceQueueService.
  private inferenceQueue: Queue;  // Queue object for managing inference jobs.
  private worker: Worker;  // Worker for processing the jobs from the queue.
  private inferenceQueueEvents: QueueEvents;  // QueueEvents for monitoring queue events.

  // Private constructor to prevent instantiation from outside the class.
  private constructor() {
      const redisConnection = RedisConnection.getInstance();  // Obtain a Redis connection instance.

      // Initialize the queue, worker, and events for managing and processing jobs.
      this.inferenceQueue = new Queue('inferenceQueue', { connection: redisConnection });
      this.worker = new Worker('inferenceQueue', this.processContents.bind(this), { connection: redisConnection });
      this.inferenceQueueEvents = new QueueEvents('inferenceQueueEvents', { connection: redisConnection });

      this.setupEventListeners();  // Setup event listeners for job lifecycle management.
  }

  // Singleton pattern to get the instance of InferenceQueueService.
  public static getInstance(): InferenceQueueService {
      if (!InferenceQueueService.instance) {
          InferenceQueueService.instance = new InferenceQueueService();
      }
      return InferenceQueueService.instance;
  }

  // Method to process the contents of the job.
  private async processContents(job: Job) {
      // Retrieve dataset based on job information.
      const dataset: Dataset | null = await DatasetDAO.getDatasetByName(job.data.datasetName, job.data.userEmail);
      if (!dataset) {
          throw ErrorFactory.createError(ErrorType.DatasetNotFound);  // Error if dataset is not found.
      }

      // Validate if sufficient tokens are available to process the job.
      if (!await checkTokenAvailability(job.data.userEmail, dataset.token_cost)) {
          throw new InsufficientTokensError(`Insufficient tokens to process job ${job.id}`);
      }

      // Perform token update and job processing inside a transaction.
      await sequelize.transaction(async (transaction) => {
          await updateTokenBalance(job.data.userEmail, -dataset.token_cost, transaction);  // Deduct tokens.

          try {
              // External API call to a Flask server for processing.
              const response = await fetch(process.env.FLASK_PREDICTION_URL || "http://flask:5000/predict", {
                  method: "POST",
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      dataset_id: dataset.dataset_id,
                      job_id: job.id,
                      model_id: job.data.modelId,
                      model_version: job.data.modelVersion
                  }),
              });

              if (!response.ok) {  // Check if the API call was successful.
                  throw new Error("Failed to process inference.");
              }

              // Update the job result in the database after successful processing.
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

  // Setup BullMQ worker event listeners to manage job status and notifications.
  private setupEventListeners() {
      this.worker.on(BullJobStatus.Active, async (job: any) => {
          ResultDAO.updateJobStatus(job.id, JobStatus.Running);  // Update job status to Running.
          sendUserMessage(job.data.userEmail, MessageType.JobActive, { userEmail: job.data.userEmail, jobId: job.id });
      });

      this.worker.on(BullJobStatus.Completed, async (job: any) => {
          ResultDAO.updateJobStatus(job.id, JobStatus.Completed);  // Update job status to Completed.
          sendUserMessage(job.data.userEmail, MessageType.JobCompleted, { userEmail: job.data.userEmail, jobId: job.id });
      });

      this.worker.on(BullJobStatus.Failed, async (job: any, error: any) => {
          if (error instanceof InsufficientTokensError) {
              ResultDAO.updateJobStatus(job.id!, JobStatus.Aborted);  // Update job status to Aborted if the token are not enough.
              sendUserMessage(job.data.userEmail, MessageType.JobAborted, { userEmail: job.data.userEmail, jobId: job.id });
          } else {
              ResultDAO.updateJobStatus(job.id, JobStatus.Failed);  // Otherwise update job status to Failed.
              sendUserMessage(job.data.userEmail, MessageType.JobFailed, { userEmail: job.data.userEmail, jobId: job.id });
          }
      });
  }

  // Add a job to the inference queue.
  public async addJobToQueue(datasetName: string, userEmail: string, modelId: ModelId, modelVersion: string): Promise<Job> {
      const job: Job = await this.inferenceQueue.add('processRequest', { datasetName, userEmail, modelId, modelVersion });
      return job;
  }
}

export default InferenceQueueService;



