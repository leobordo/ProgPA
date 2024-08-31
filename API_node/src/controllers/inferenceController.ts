/**
 * @fileOverview This file contains the controllers associated to the routes of the inference Router
 */
import { Request, Response } from 'express';
import * as service from '../services/inferenceService';
import { IResult, JobStatus } from '../models/job';

/** 
 * Adds a new inference job to the queue with the specified dataset and model version.
 * @param {Request} req - The Express request object containing
 *                            the name of the dataset to infer from
 *                            the id of the model to use
 *                            the version of the model to use and
 *                            the user's email address.
 * @param {Response} res - The Express response object used for sending back the HTTP response.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 *                          The response contains the job ID which can be used later to check 
 *                          the job status and/or retrieve its result (or an error message).                       
 */
const makeInference = async (req: Request, res: Response): Promise<void> => {

    //Request parameters extraction
    const modelId = req.body.modelId;
    const modelVersion = req.body.modelVersion;
    const datasetName = req.body.datasetName;
    const userEmail = req.user!.userEmail;
    
    try {
      //Adds the job to the queue and receives the Id 
      const jobId = await service.requestDatasetInference(datasetName, userEmail, modelId, modelVersion);
      res.send({ message: "Process added succesfully to the queue", jobId: jobId});
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: 'An error occurred while processing the image' });
    }
  };


/** 
 * Gets the status of the specified job (by ID).
 * If the status is COMPLETED, also gets the job result in JSON format
 * @param {Request} req - The Express request object containing
 *                            the job whose status is to be retrieved and
 *                            the user's email address.
 * @param {Response} res - The Express response object used for sending back the HTTP response.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 *                          The response contains the status of the specified job and, if it's completed, 
 *                          its result (in JSON format)                       
 */
const checkState = async (req: Request, res: Response): Promise<void> => {
  const jobId = req.body.jobId;
  const userEmail = req.user!.userEmail;

    try {
      //Retrieves the job status by its ID
      const jobStatus:JobStatus = await service.getProcessStatus(jobId, userEmail);
      
      if (jobStatus === JobStatus.Completed) {
        //Retrieves the job result by its ID
        const result:IResult = await service.getProcessResult(jobId, userEmail);
        res.send({jobState: jobStatus, result: result.jsonResult});
      } else {
        //If the job isn't completed, returns only its status
        res.send({jobState: jobStatus});
      }   
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: 'Internal error' });
    }
  };


/** 
 * Gets the result of the specified job (by ID) if it's COMPLETED.
 * @param {Request} req - The Express request object containing:
 *                            - the job whose status is to be retrieved;
 *                            - the user's email address.
 * @param {Response} res - The Express response object used for sending back the HTTP response.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 *                          The response contains the job result in json format and the URI associated
 *                          to the location where are stored the annotated contents                      
 */
const getResult = async (req: Request, res: Response): Promise<void> => {
    const jobId = req.body.jobId;
    const userEmail = req.user!.userEmail;
      
    try {
      //Retrieves the job status by its ID
      const jobStatus:JobStatus = await service.getProcessStatus(jobId, userEmail);
      if (jobStatus === JobStatus.Completed) {
        //Retrieves the job result by its ID
        const result:IResult = await service.getProcessResult(jobId, userEmail);
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