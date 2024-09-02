import { Job, Queue, Worker, QueueEvents } from 'bullmq';
import RedisConnection from '../utils/redisConnection';
import DatasetDAO from "../dao/datasetDao";
import { Dataset } from "../models/sequelize_model/Dataset";
import { checkTokenAvailability, updateTokenBalance } from "./tokenManagementService";
import ResultDAO from "../dao/resultDao";
import { BullJobStatus, JobStatus } from "../models/job";
import { sequelize } from '../config/sequelize';
import { ApplicationError, ErrorFactory, ErrorType, InsufficientTokensError } from "../utils/errorFactory";
import { sendMessageToUser } from '../websocket/websocketServer';
import { sendUserMessage, MessageType } from '../websocket/websocketMessages';
import { ModelId } from '../models/aiModels';

class InferenceQueueService {
  private static instance: InferenceQueueService;
  private inferenceQueue: Queue;
  private worker: Worker;
  private inferenceQueueEvents: QueueEvents;

  private constructor() {
      const redisConnection = RedisConnection.getInstance();

      // Initialize Queue and Worker
      this.inferenceQueue = new Queue('inferenceQueue', { connection: redisConnection });
      this.worker = new Worker('inferenceQueue', this.processContents.bind(this), { connection: redisConnection });
      this.inferenceQueueEvents = new QueueEvents('inferenceQueueEvents', { connection: redisConnection });

      // Set up worker event listeners
      this.setupEventListeners();
  }

  public static getInstance(): InferenceQueueService {
      if (!InferenceQueueService.instance) {
          InferenceQueueService.instance = new InferenceQueueService();
      }
      return InferenceQueueService.instance;
  }

  private async processContents(job: Job) {
      // Retrieve the dataset information
      const dataset: Dataset | null = await DatasetDAO.getDatasetByName(job.data.datasetName, job.data.userEmail);
      if (!dataset) {
          throw ErrorFactory.createError(ErrorType.DatasetNotFound);
      }

      // Check token availability
      if (!await checkTokenAvailability(job.data.userEmail, dataset.token_cost)) {
          throw ErrorFactory.createError(ErrorType.InsufficientTokens, `Insufficient tokens to process job ${job.id}`);
      }

      // Use a managed transaction
      await sequelize.transaction(async (transaction) => {
          // Update token balance
          await updateTokenBalance(job.data.userEmail, dataset.token_cost, transaction);

          try {
              // Send inference request to the Flask API
              const response = await fetch(process.env.FLASK_PREDICTION_URL || "http://flask:5000/predict", {
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

              if (!response.ok) {
                  throw ErrorFactory.createError(ErrorType.InferenceError);
              }

              // Parse and store job result
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

  private setupEventListeners() {
      this.worker.on(BullJobStatus.Active, async (job: any) => {
          ResultDAO.updateJobStatus(job.id, JobStatus.Running);
          const userEmail = job.data.userEmail;
          sendUserMessage(userEmail, MessageType.JobActive, { userEmail, jobId: job.id });
      });

      this.worker.on(BullJobStatus.Completed, async (job: any) => {
          ResultDAO.updateJobStatus(job.id, JobStatus.Completed);
          const userEmail = job.data.userEmail;
          sendUserMessage(userEmail, MessageType.JobCompleted, { userEmail, jobId: job.id });
      });

      this.worker.on(BullJobStatus.Failed, async (job: any, error: any) => {
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
  }

  public async addJobToQueue(datasetName: string, userEmail: string, modelId: ModelId, modelVersion: string): Promise<Job> {
      const job: Job = await this.inferenceQueue.add('processRequest', { datasetName, userEmail, modelId, modelVersion });
      return job;
  }

}

export default InferenceQueueService;

