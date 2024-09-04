/**
 * @fileOverview Dataset controller module.
 *
 * This module contains controller functions for managing datasets in the application.
 * It provides functionality to create, retrieve, update, and delete datasets, as well as 
 * insert contents into existing datasets. Each function interacts with the data services 
 * to perform the necessary operations and responds to the client with appropriate HTTP status codes.
 */

import { Response, Request, NextFunction } from 'express'; // Import Express types
import * as dataServices from '../services/dataServices'; // Import the data services
import HTTPStatus from 'http-status-codes'; // Import HTTPStatus module

/**
 * Create a new dataset.
 *
 * This function validates the request input, splits tags into an array, and creates a new dataset
 * using the data service. It then responds with the created dataset details.
 *
 * @param {Request} req - Express request object containing dataset details.
 * @param {Response} res - Express response object for sending the response.
 * @param {NextFunction} next - Express next middleware function for error handling.
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
    const dataset_id = result.newDataset.dataset_id
    const file_path = result.newDataset.file_path
    const token_cost = result.newDataset.token_cost
    const dataset_name = result.newDataset.dataset_name

    // Respond with created dataset
    res.status(HTTPStatus.CREATED).json({message: result.message, dataset: {dataset_name, dataset_id, file_path, token_cost, tags}});
  } catch (error) {
    next(error)
  }
};

/**
 * Retrieve all datasets.
 *
 * This function retrieves all datasets associated with the user's email from the data service 
 * and responds with the datasets.
 *
 * @param {Request} req - Express request object containing user email.
 * @param {Response} res - Express response object for sending the response.
 * @param {NextFunction} next - Express next middleware function for error handling.
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
 * Update a dataset by name.
 *
 * This function updates an existing dataset based on the provided name and new details. 
 * It can update the dataset name and tags and responds with a success message.
 *
 * @param {Request} req - Express request object containing dataset update details.
 * @param {Response} res - Express response object for sending the response.
 * @param {NextFunction} next - Express next middleware function for error handling.
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
    res.status(HTTPStatus.OK).json({message: updatedMessage});
  } catch (error) {
    next(error)
  }
};

/**
 * Delete a dataset by name.
 *
 * This function deletes a dataset based on the provided name and user email. 
 * It responds with a success message upon successful deletion.
 *
 * @param {Request} req - Express request object containing dataset name to delete.
 * @param {Response} res - Express response object for sending the response.
 * @param {NextFunction} next - Express next middleware function for error handling.
 */
const deleteDatasetByName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const datasetName = req.body.datasetName;
    const email = req.user?.userEmail;

    // Deletes dataset using the data service
    await dataServices.deleteDatasetByName(datasetName!, email!);

    // Responds with success message
    const message: string = 'Dataset ' + datasetName + ' deleted successfully';
    res.status(HTTPStatus.OK).json({ message: message});
  } catch (error) {
    next(error)
  }
};

/**
 * Insert contents into a dataset.
 *
 * This function inserts contents into an existing dataset based on the provided dataset name 
 * and file. It responds with a success message upon successful insertion.
 *
 * @param {Request} req - Express request object containing dataset name and file to insert.
 * @param {Response} res - Express response object for sending the response.
 * @param {NextFunction} next - Express next middleware function for error handling.
 */
const insertContents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const datasetName = req.body.datasetName;
    const file = req.file;
    const email = req.user?.userEmail;

    // Insert contents into dataset using the data service
    const message = await dataServices.insertContents(datasetName!, file!, email!);

    // Respond with success message
    res.status(HTTPStatus.CREATED).json({ message });
  } catch (error) {
    next(error)
  }
};

// Export controller functions for use in other modules
export { getAllDatasets, createDataset, deleteDatasetByName, updateDatasetByName, insertContents };
