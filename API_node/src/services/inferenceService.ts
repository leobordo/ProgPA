
/**
 * @fileoverview This module define a Singleton service class to manage inference jobs. It allows
 * for requesting inferences on datasets (adding to a queue), retrieving job statuses, and accessing the results
 * of completed jobs. This service interacts with other data access objects and services,
 * including DatasetDAO, ResultDAO, and InferenceQueueService.
 */
import { Job } from "bullmq";                           // Importing Job from bullmq for job management in a queue.
import { IResult, JobStatus } from "../models/jobStatus";     // Importing types related to job statuses and result interfaces.
import DatasetDAO from "../dao/datasetDao";             // Data access object for datasets.
import { Dataset } from "../models/sequelize_model/Dataset";    // Sequelize model for datasets.
import ResultDAO from "../dao/resultDao";               // Data access object for job results.
import { ModelId } from "../models/aiModels";           // Type definition for AI model IDs.
import { Result } from "../models/sequelize_model/Result";      // Sequelize model for results.
import { ApplicationError, ErrorFactory, ErrorType } from "../utils/errorFactory";  // Utilities for error handling.
import InferenceQueueService from "./inferenceQueue";   // Service for managing inference jobs in a queue.

/**
 * @class InferenceService is a Singleton class that provides methods to request inference on 
 * specific datasets, check the status of these jobs, and retrieve the results once completed.
 * This service acts as a bridge between the user's requests via API and the actual execution 
 * of these requests in the inference queue.
 */
class InferenceService {
    private static instance: InferenceService;      // Singleton instance of the InferenceService.
    private inferenceQueue: InferenceQueueService;  // Reference to the inference queue service.

    // Private constructor to prevent instantiation from outside the class.
    private constructor() {
        this.inferenceQueue = InferenceQueueService.getInstance();  // Initialize the inference queue service.
    }

    /**
    * Provides access to the singleton InferenceService instance. If the instance does not exist, 
    * it creates a new InferenceService instance.
    * 
    * @returns {Redis} The singleton Redis instance.
    */
    public static getInstance(): InferenceService {
        if (!InferenceService.instance) {
            InferenceService.instance = new InferenceService();
        }
        return InferenceService.instance;
    }

    /**
     * Adds the job to the queue of the inference requests.
     * @param datasetName The name of the dataset to infer.
     * @param userEmail The email of the user requesting the inference.
     * @param modelId The ID of the model to use for inference.
     * @param modelVersion The version of the model to use for inference.
     * @returns The job ID.
     */
    public async requestDatasetInference(
        datasetName: string,
        userEmail: string,
        modelId: ModelId,
        modelVersion: string
    ): Promise<string | undefined> {
        
        // Retrieve dataset by name and user email.
        const dataset: Dataset | null = await DatasetDAO.getDatasetByName(datasetName, userEmail);
        if (!dataset) {
            throw ErrorFactory.createError(ErrorType.DatasetNotFound);
        }

        try {
            // Add the inference job to the queue.
            const job: Job = await this.inferenceQueue.addJobToQueue(datasetName, userEmail, modelId, modelVersion);
            // Create a job entry in the database.
            ResultDAO.createJob(job.id!, JobStatus.Pending, modelId, modelVersion, dataset.dataset_id);
            return job.id;
        } catch (error) {
            if (!(error instanceof ApplicationError)) {
                throw ErrorFactory.createError(ErrorType.Generic, "An error occurred while adding the job to the queue.");
            } else {
                throw error;
            }
        }
    }

    /**
     * Retrieves a job by its ID if it belongs to the specified user.
     * @param jobId The job ID.
     * @param userEmail The email of the user.
     * @returns The job as a Result object.
     */
    public async getUserJob(jobId: string, userEmail: string): Promise<Result> {
        const job: Result | null = await ResultDAO.getUserJobByID(jobId, userEmail);
        if (!job) {
            throw ErrorFactory.createError(ErrorType.JobNotFoundError);
        }
        return job;
    }

    /**
     * Retrieves the result of a completed job.
     * @param jobId The ID of the job whose result is to be retrieved.
     * @param userEmail The email of the user who made the request.
     * @returns The result of the job.
     */
    public async getJobResult(jobId: string, userEmail: string): Promise<IResult> {
        const job: Result | null = await this.getUserJob(jobId, userEmail);
        if (job.state !== JobStatus.Completed || !job.result) {
            throw ErrorFactory.createError(ErrorType.JobNotCompletedError);
        }

        // Parse the result JSON and construct the URI for the content.
        const jsonResult = JSON.parse(job.result);
        const uri = `user/uploads/${job.dataset_id}/annotated_files/${job.job_id}`;
        return { jsonResult: jsonResult, contentURI: uri } as IResult;
    }

    /**
     * Retrieves the job state along with the result if the job is completed.
     * @param jobId The ID of the job whose state is to be retrieved.
     * @param userEmail The email of the user who made the request.
     * @returns The job state and result if completed, otherwise just the state.
     */
    public async getJobStateWithResult(jobId: string, userEmail: string) {
        const job: Result | null = await this.getUserJob(jobId, userEmail);
        if (job.state !== JobStatus.Completed) {
            return { jobState: job.state, result: null };
        }
        if (!job.result) {
            throw ErrorFactory.createError(ErrorType.Generic, "The job is completed but result is missing");
        }
        return { jobState: job.state, result: JSON.parse(job.result) };
    }
}

// Export the InferenceService for use throughout the application.
export default InferenceService;
