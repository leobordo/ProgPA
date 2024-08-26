import { Response, Request } from 'express';
import * as dataServices from '../services/dataServices'; // Import the service
import { ErrorType, ErrorFactory } from '../services/errorFactory';

/**
 * Create a new dataset
 * @param req - Express request object
 * @param res - Express response object
 */
const createDataset = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const datasetName = req.body.datasetName;
    const tags = req.body.tags;
    const email = req.user?.userEmail;
    
    dataServices.validateRequiredParams({ datasetName, tags}, ['datasetName', 'tags']);

    const result = await dataServices.createDataset(datasetName, tags, email!);
    res.status(201).json(result);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get all datasets
 * @param req - Express request object
 * @param res - Express response object
 */
const getAllDatasets = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = req.user?.userEmail;

    const datasets = await dataServices.getAllDatasets(email!);
    res.status(200).json(datasets);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

/**
 * Update a dataset by name
 * @param req - Express request object
 * @param res - Express response object
 */
const updateDatasetByName = async (req: Request, res: Response): Promise<void> => {
  try {
    const datasetName = req.body.datasetName;
    const newName = req.body.newDatasetName;
    const tags = req.body.newTags;
    const email = req.user?.userEmail;

    dataServices.validateRequiredParams({ datasetName}, ['datasetName']);

    const updatedDataset = await dataServices.updateDatasetByName(datasetName, newName, tags, email!);
    res.status(200).json({ message: 'Dataset updated successfully', dataset: updatedDataset });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

/**
 * Delete a dataset by name
 * @param req - Express request object
 * @param res - Express response object
 */
const deleteDatasetByName = async (req: Request, res: Response): Promise<void> => {
  try {
    const datasetName = req.body.datasetName;
    const email = req.user?.userEmail;

    dataServices.validateRequiredParams({ datasetName}, ['datasetName']);

    await dataServices.deleteDatasetByName(datasetName, email!);
    res.status(200).json({ message: 'Dataset deleted successfully' });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

/**
 * Insert contents into a dataset
 * @param req - Express request object
 * @param res - Express response object
 */
const insertContents = async (req: Request, res: Response): Promise<void> => {
  try {
    const datasetName = req.body.datasetName;
    const file = req.file;
    const email = req.user?.userEmail;
    
    dataServices.validateRequiredParams({ datasetName, file}, ['datasetName', 'file']);

    const message = await dataServices.insertContents(datasetName, file!, email!);
    res.status(201).json({ message });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

export { getAllDatasets, createDataset, deleteDatasetByName, updateDatasetByName, insertContents };
