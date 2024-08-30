import { Job } from "bullmq";
import { IResult, JobStatus, BullJobStatus} from "../models/job";
import DatasetDAO from "../dao/datasetDao";
import { Dataset } from "../models/sequelize_model/Dataset";
import ResultDAO from "../dao/resultDao";
import { ModelId } from "../models/aiModels";
import { Result } from "../models/sequelize_model/Result";
const {inferenceQueue} = require('./inferenceQueue');

// Adds the job to the queue and returns its ID which can be used later to check the job status and/or retrieve its result
const requestDatasetInference = async (datasetName: string, userEmail:string, modelId:ModelId, modelVersion:string): Promise<string|undefined> => {

    //Retrieve the dataset informations
    const dataset:Dataset = await DatasetDAO.getDatasetByName(datasetName, userEmail);

    // Adds the job to the queue, store its information into the dataset and return its ID
    const job:Job = await inferenceQueue.add('processRequest', { datasetName, userEmail, modelId, modelVersion});
    ResultDAO.createJob(job.id!, JobStatus.Pending, modelId, modelVersion, dataset.dataset_id);
    return job.id;    
};

// Returns the status of the specified job (by ID)
const getProcessStatus = async (jobId: string, userEmail: string): Promise<JobStatus> => {
    return (await ResultDAO.getUserJobByID(jobId, userEmail)).state;
};

// Returns an object which includes the result (content URI and JSON) of the specified job (by ID)
const getProcessResult = async (jobId: string, userEmail:string): Promise<IResult> => {
    const job:Result = await ResultDAO.getUserJobByID(jobId, userEmail);
    const uri = `user/uploads/${job.dataset_id}/annotated_files/${job.job_id}`;
    if (job.result) {
        const jsonResult = JSON.parse(job.result);
        // chiamata ad una funzione del dao per prendere il risultato del job dal db
        return {jsonResult: jsonResult, contentURI: uri};
    }
    throw Error("The job has no results");
};

export {requestDatasetInference, getProcessStatus, getProcessResult};