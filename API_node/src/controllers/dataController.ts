import { Response, Request, NextFunction } from 'express'; // Import Express types
import * as dataServices from '../services/dataServices'; // Import the data services
import  HTTPStatus from 'http-status-codes'; // Import HTTPStatus module

/**
 * Create a new dataset
 * @param req - Express request object
 * @param res - Express response object
 */
const createDataset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate input
    const datasetName = req.body.datasetName;
    const tags = req.body.tags;
    const email = req.user?.userEmail;
    
    // Split tags into an array and trim whitespace
    const arrayTag = tags.split(',').map((element: string) => element.trim());
    
    // Create dataset using the data service
    const result = await dataServices.createDataset(datasetName!, arrayTag, email!);
    // Respond with created dataset
    res.status(HTTPStatus.CREATED).json({message: result.message, dataset: result.newDataset});
  } catch (error) {
    next(error)
  }
};

/**
 * Get all datasets
 * @param req - Express request object
 * @param res - Express response object
 */
const getAllDatasets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const email = req.user?.userEmail;

    // Get all datasets associated with the user's email
    const results = await dataServices.getAllDatasets(email!);
  
    // Respond with the datasets
    res.status(HTTPStatus.OK).json(results);
  } catch (error) {
    next(error)
};
}

/**
 * Update a dataset by name
 * @param req - Express request object
 * @param res - Express response object
 */
const updateDatasetByName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const datasetName = req.body.datasetName;
    const newName = req.body.newDatasetName;
    let tags: string[] | undefined;

    // Check if new tags are provided, split into array and remove duplicates
    if (req.body.newTags) {
      tags = req.body.newTags.split(',').map((element: string) => element.trim());
      tags = [...new Set(tags)];
    }

    const email = req.user?.userEmail;

    // Update dataset using the data service
    const updatedMessage = await dataServices.updateDatasetByName(datasetName!, email!, newName, tags);
    
    // Respond with updated message
    res.status(HTTPStatus.OK).json(updatedMessage);
  } catch (error) {
  next(error)
  }
};

/**
 * Delete a dataset by name
 * @param req - Express request object
 * @param res - Express response object
 */
const deleteDatasetByName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const datasetName = req.body.datasetName;
    const email = req.user?.userEmail;

    // Delete dataset using the data service
    const result_message = await dataServices.deleteDatasetByName(datasetName!, email!);
    
    // Respond with success message
    res.status(HTTPStatus.OK).json({ message: result_message });
} catch (error) {
    next(error)
  }
};

/**
 * Insert contents into a dataset
 * @param req - Express request object
 * @param res - Express response object
 */
const insertContents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const datasetName = req.body.datasetName;
    const file = req.file;
    const email = req.user?.userEmail;

    // Insert contents into dataset using the data service
    const result_message = await dataServices.insertContents(datasetName!, file!, email!);
    
    // Respond with success message
    res.status(HTTPStatus.CREATED).json({ message: result_message });
} catch (error) {
    next(error)
  }
};

// Export controller functions for use in other modules
export { getAllDatasets, createDataset, deleteDatasetByName, updateDatasetByName, insertContents };
