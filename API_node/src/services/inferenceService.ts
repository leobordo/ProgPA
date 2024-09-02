import { Job } from "bullmq";
import { IResult, JobStatus, BullJobStatus } from "../models/job";
import DatasetDAO from "../dao/datasetDao";
import { Dataset } from "../models/sequelize_model/Dataset";
import ResultDAO from "../dao/resultDao";
import { ModelId } from "../models/aiModels";
import { Result } from "../models/sequelize_model/Result";
import { ApplicationError, ErrorFactory, ErrorType } from "../utils/errorFactory";
const { inferenceQueue } = require('./inferenceQueue');

// Adds the job to the queue and returns its ID which can be used later to check the job status and/or retrieve its result
const requestDatasetInference = async (datasetName: string, userEmail: string, modelId: ModelId, modelVersion: string): Promise<string | undefined> => {

    //Retrieve the dataset informations
    const dataset: Dataset | null = await DatasetDAO.getDatasetByName(datasetName, userEmail);
    if (!dataset) {
        throw ErrorFactory.createError(ErrorType.DatasetNotFound); // Throw error if dataset not found
    }

    try {
        // Adds the job to the queue, store its information into the dataset and return its ID
        const job: Job = await inferenceQueue.add('processRequest', { datasetName, userEmail, modelId, modelVersion });
        ResultDAO.createJob(job.id!, JobStatus.Pending, modelId, modelVersion, dataset.dataset_id);
        return job.id;
    } catch (error) {
        if (!(error instanceof ApplicationError)) {
            throw ErrorFactory.createError(ErrorType.Generic, "An error occurred while adding the job to the queue.")
        } else {
            throw error;
        }
    }
};

// Returns the status of the specified job (by ID)
const getUserJob = async (jobId: string, userEmail: string): Promise<Result> => {
    const job: Result | null = await ResultDAO.getUserJobByID(jobId, userEmail);
    if (!job) {
        throw ErrorFactory.createError(ErrorType.JobNotFoundError);
    }
    return job;
};

// Returns an object which includes the result (content URI and JSON) of the specified job (by ID)
const getJobResult = async (jobId: string, userEmail: string): Promise<IResult> => {
    const job: Result | null = await getUserJob(jobId, userEmail);
    if (job.state !== JobStatus.Completed || !job.result) {
        throw ErrorFactory.createError(ErrorType.JobNotCompletedError);
    }

    const jsonResult = JSON.parse(job.result);
    const uri = `user/uploads/${job.dataset_id}/annotated_files/${job.job_id}`;
    return { jsonResult: jsonResult, contentURI: uri };
};

const getJobStateWithResult = async (jobId: string, userEmail: string) => {
    const job: Result | null = await getUserJob(jobId, userEmail);
    if (job.state !== JobStatus.Completed) {
        return {jobState: job.state, result: null}
    } 
    if (!job.result) {
        throw ErrorFactory.createError(ErrorType.Generic, "The job is completed but result is missing");
    }
    return {jobState: job.state, result: JSON.parse(job.result)}
};

export { requestDatasetInference, getJobResult, getJobStateWithResult};