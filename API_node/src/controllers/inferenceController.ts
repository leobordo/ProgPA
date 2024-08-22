import { Request, Response } from 'express';
import * as service from '../services/inferenceService';

// 
const makeInference = async (req: Request, res: Response): Promise<void> => {
    const modelId = req.body.modelId;
    const modelVersion = req.body.modelId;
    const datasetName = req.body.datasetName;
    const user = req.body.auth.payload.email;
    
    try {
      const process_id = await service.requestDatasetInference(datasetName, user, modelId, modelVersion);
      res.send({ message: "Process added succesfully", process_id: process_id});
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: 'An error occurred while processing the image' });
    }
  };

// 
const checkState = async (req: Request, res: Response): Promise<void> => {
    //...
  };

// 
const getResult = async (req: Request, res: Response): Promise<void> => {
    //...
  };


export { makeInference, checkState, getResult};