import { Job } from "bullmq";
import { IResult, JobStatus } from "../models/job";

const {inferenceQueue} = require('./queue');

// Adds the job to the queue and returns its ID which can be used later to check the job status and/or retrieve its result
const requestDatasetInference = async (datasetName: string, user:string, modelId:string, modelVersion:string): Promise<string|undefined> => {
    const job:Job = await inferenceQueue.add('processRequest', { datasetName, user, modelId, modelVersion });
    return job.id;
};

// Returns the status of the specified job (by ID)
const getProcessStatus = async (jobId: string): Promise<JobStatus> => {
    const job = await inferenceQueue.getJob(jobId);
    if (job) {
        return job.getState();
    }
    // chiamata ad una funzione del dao per prendere lo stato del job dal db
    return JobStatus.Completed;
};

// Returns an object which includes the result (content URI and JSON) of the specified job (by ID)
const getProcessResult = async (jobId: string): Promise<IResult> => {
    // chiamata ad una funzione del dao per prendere il risultato del job dal db
    return {jsonResult: "{}", contentURI: ""};
};

export {requestDatasetInference, getProcessStatus, getProcessResult};