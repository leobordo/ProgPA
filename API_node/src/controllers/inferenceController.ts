import { Request, Response } from 'express';
import * as service from '../services/inferenceService';
import { IResult, JobStatus } from '../models/job';

/* 
  It adds to the queue the work consisting of inferring the specified dataset 
  (belonging to the user) with the specified model (by id and version)
  Finally it returns the job ID which can be used later to check the job status and/or retrieve its result. 
*/
const makeInference = async (req: Request, res: Response): Promise<void> => {

    //Request parameter extraction
    const modelId = req.body.modelId;
    const modelVersion = req.body.modelVersion;
    const dataset_name = req.body.dataset_name;
    const user = req.body.auth.payload.email;
    
    try {
      //Adds the job to the queue and receives the Id 
      const jobId = await service.requestDatasetInference(dataset_name, user, modelId, modelVersion);
      res.send({ message: "Process added succesfully", jobId: jobId});
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: 'An error occurred while processing the image' });
    }
  };

/*
  Returns the status of the specified job (by ID)
  If the status is COMPLETED, also returns the job result in JSON format
*/
const checkState = async (req: Request, res: Response): Promise<void> => {
    const jobId = req.body.jobId;
    
    try {
      //Retrieves the job status by its ID
      const jobStatus:JobStatus = await service.getProcessStatus(jobId);
      if (jobStatus === JobStatus.Completed) {
        //Retrieves the job result by its ID
        const result:IResult = await service.getProcessResult(jobId);
        res.send({jobState: jobStatus, result: result.jsonResult});
      }
      //If the job isn't completed, returns only its status
      res.send({jobState: jobStatus});
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: 'Internal error' });
    }
  };

/*
  Returns the result (content URI and JSON) of the specified job (by ID)
*/
const getResult = async (req: Request, res: Response): Promise<void> => {
    const jobId = req.body.jobId;
      
    try {
      //Retrieves the job status by its ID
      const jobStatus:JobStatus = await service.getProcessStatus(jobId);
      if (jobStatus === JobStatus.Completed) {
        //Retrieves the job result by its ID
        const result:IResult = await service.getProcessResult(jobId);
        res.send({contentURI: result.contentURI, result: result.jsonResult});
      }
      //If the job isn't completed, returns an error
      throw Error("The job is not completed")
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Internal error" });
    }
  };


export { makeInference, checkState, getResult};