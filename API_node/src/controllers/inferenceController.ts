/**
 * @fileOverview This file contains the controllers associated to the routes of the inference Router
 */
import { NextFunction, Request, Response } from 'express';
import InferenceService from '../services/inferenceService';
import { IResult, JobStatus } from '../models/jobStatus';
import HTTPStatus from 'http-status-codes';

const inferenceService = InferenceService.getInstance();

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
const makeInference = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    //Request parameters extraction
    const { modelId, modelVersion, datasetName } = req.body;
    const userEmail = req.user!.userEmail;

    //Adds the job to the queue and receives the Id 
    const jobId = await inferenceService.requestDatasetInference(datasetName, userEmail, modelId, modelVersion);
    res.status(HTTPStatus.OK).send({ message: "Process added successfully to the queue", jobId: jobId });
  } catch (error) {
    next(error);
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
const checkState = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const jobId = req.body.jobId;
  const userEmail = req.user!.userEmail;

  try {
    const jobData = await inferenceService.getJobStateWithResult(jobId, userEmail);
    res.status(HTTPStatus.OK).send(jobData);
  } catch (error) {
    next(error);
  }
};

/** 
 * Gets the result of the specified job (by ID) if it's completed.
 * @param {Request} req - The Express request object containing:
 *                            the job whose status is to be retrieved and
 *                            the user's email address.
 * @param {Response} res - The Express response object used for sending back the HTTP response.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 *                          The response contains the job result in json format and the URI associated
 *                          to the location where are stored the annotated contents                      
 */
const getResult = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const jobId = req.body.jobId;
  const userEmail = req.user!.userEmail;

  try {
    const jobData:IResult = await inferenceService.getJobResult(jobId, userEmail);
    res.status(HTTPStatus.OK).send(jobData);
  } catch (error) {
    next(error);
  }
};

export { makeInference, checkState, getResult };