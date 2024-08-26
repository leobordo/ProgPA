import { Job } from "bullmq";
import { IResult, JobStatus } from "../models/job";
import DatasetDAO from "../dao/datasetDao";
import { Dataset } from "../models/sequelize_model/Dataset";
import ResultDAO from "../dao/resultDao";
import { ModelId } from "../models/aiModels";
import { Result } from "../models/sequelize_model/Result";

const {inferenceQueue} = require('./queue');

// Adds the job to the queue and returns its ID which can be used later to check the job status and/or retrieve its result
const requestDatasetInference = async (dataset_name: string, userEmail:string, modelId:ModelId, modelVersion:string): Promise<string|undefined> => {

    //Retrieve the dataset informations
    const dataset:Dataset = await DatasetDAO.getDatasetByName(dataset_name, userEmail);

    //Checks if the user has enough tokens to perform the inference on the dataset
    //if (await checkTokenAvailability(userEmail, dataset.tokenCost)) {

    // Adds the job to the queue, store its information into the dataset and return its ID
    const job:Job = await inferenceQueue.add('processRequest', { dataset_name, userEmail, modelId, modelVersion});
    if (job.id) { 
        ResultDAO.createJob(job.id, JobStatus.Pending, modelId, modelVersion, dataset.dataset_id);
        return job.id;
    } else {
        throw Error("job id is undefined");
    }        
    //} 
};

// Returns the status of the specified job (by ID)
const getProcessStatus = async (jobId: string): Promise<JobStatus> => {

    //if the job is in the Queue, retrieves its status from it
    const job = await inferenceQueue.getJob(jobId);
    console.log(inferenceQueue)
    if (job) {
        console.log("OK")
        const jobState = job.getState();
        const mappedJobState:JobStatus = mapState(jobState); // Utilizza la funzione di mappatura
    }
    console.log(jobId)
    //Otherwise search for the job in the db and return its status
    return (await ResultDAO.getJob(jobId)).state;
};

// Returns an object which includes the result (content URI and JSON) of the specified job (by ID)
const getProcessResult = async (jobId: string): Promise<IResult> => {
    const job:Result = await ResultDAO.getJob(jobId);
    const uri = `user/uploads/${job.dataset_id}/annotated_files/${job.job_id}`;
    job.dataset_id
    if (job.result) {
        const jsonResult = JSON.parse(job.result);
        // chiamata ad una funzione del dao per prendere il risultato del job dal db
        return {jsonResult: jsonResult, contentURI: uri};
    }
    throw Error("The job has no results");
};


function mapState(state: string): JobStatus {
    const stateMapping: { [key: string]: JobStatus } = {
      waiting: JobStatus.Pending,
      delayed: JobStatus.Pending,
      active: JobStatus.Running,
      completed: JobStatus.Completed,
      failed: JobStatus.Failed
    };
    return stateMapping[state] || 'Unknown';
  }

export {requestDatasetInference, getProcessStatus, getProcessResult};