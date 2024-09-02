import { Job } from "bullmq";
import { IResult, JobStatus, BullJobStatus } from "../models/job";
import DatasetDAO from "../dao/datasetDao";
import { Dataset } from "../models/sequelize_model/Dataset";
import ResultDAO from "../dao/resultDao";
import { ModelId } from "../models/aiModels";
import { Result } from "../models/sequelize_model/Result";
import { ApplicationError, ErrorFactory, ErrorType } from "../utils/errorFactory";
import InferenceQueueService from "./inferenceQueue";

class InferenceService {
    private static instance: InferenceService;
    private inferenceQueue: InferenceQueueService;

    private constructor() {
        this.inferenceQueue = InferenceQueueService.getInstance();
    }

    public static getInstance(): InferenceService {
        if (!InferenceService.instance) {
            InferenceService.instance = new InferenceService();
        }
        return InferenceService.instance;
    }

    public async requestDatasetInference(
        datasetName: string,
        userEmail: string,
        modelId: ModelId,
        modelVersion: string
    ): Promise<string | undefined> {
        const dataset: Dataset | null = await DatasetDAO.getDatasetByName(datasetName, userEmail);
        if (!dataset) {
            throw ErrorFactory.createError(ErrorType.DatasetNotFound);
        }

        try {
            const job: Job = await this.inferenceQueue.addJobToQueue(datasetName, userEmail, modelId, modelVersion);
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

    public async getUserJob(jobId: string, userEmail: string): Promise<Result> {
        const job: Result | null = await ResultDAO.getUserJobByID(jobId, userEmail);
        if (!job) {
            throw ErrorFactory.createError(ErrorType.JobNotFoundError);
        }
        return job;
    }

    public async getJobResult(jobId: string, userEmail: string): Promise<IResult> {
        const job: Result | null = await this.getUserJob(jobId, userEmail);
        if (job.state !== JobStatus.Completed || !job.result) {
            throw ErrorFactory.createError(ErrorType.JobNotCompletedError);
        }

        const jsonResult = JSON.parse(job.result);
        const uri = `user/uploads/${job.dataset_id}/annotated_files/${job.job_id}`;
        return { jsonResult: jsonResult, contentURI: uri };
    }

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

export default InferenceService;