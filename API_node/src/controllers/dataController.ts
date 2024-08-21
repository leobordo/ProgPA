import { Request, Response } from 'express';
import * as dataServices from '../services/dataServices'; // Importa il servizio

const createDataset = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await dataServices.createDataset(req);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create dataset', error: err.message });
  }
};

const getAllDatasets = async (req: Request, res: Response): Promise<void> => {
  try {
    const datasets = await dataServices.getAllDatasets(req);
    res.status(200).json(datasets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve datasets', error: error.message });
  }
};

const updateDatasetByName = async (req: Request, res: Response): Promise<void> => {
  try {
    const updatedDataset = await dataServices.updateDatasetByName(req);
    res.status(200).json({ message: 'Dataset updated successfully', dataset: updatedDataset });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update dataset', error: error.message });
  }
};

const deleteDatasetByName = async (req: Request, res: Response): Promise<void> => {
  try {
    await dataServices.deleteDatasetByName(req);
    res.status(200).json({ message: 'Dataset deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete dataset', error: error.message });
  }
};

const insertContents = async (req: Request, res: Response): Promise<void> => {
  try {
    const message = await dataServices.insertContents(req);
    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload content', error: error.message });
  }
};

export { getAllDatasets, createDataset, deleteDatasetByName, updateDatasetByName, insertContents };
