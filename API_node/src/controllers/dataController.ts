import { Response, Request } from 'express';
import * as dataServices from '../services/dataServices'; // Importa il servizio

const createDataset = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log(req.user)
    const result = await dataServices.createDataset(req);
    res.status(201).json(result);
  } catch (error) {
    console.log("OK")
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

const getAllDatasets = async (req: Request, res: Response): Promise<void> => {
  try {
    const datasets = await dataServices.getAllDatasets(req);
    res.status(200).json(datasets);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

const updateDatasetByName = async (req: Request, res: Response): Promise<void> => {
  try {
    const updatedDataset = await dataServices.updateDatasetByName(req);
    res.status(200).json({ message: 'Dataset updated successfully', dataset: updatedDataset });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

const deleteDatasetByName = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("QUIi")
    await dataServices.deleteDatasetByName(req);
    console.log("QUI2")
    res.status(200).json({ message: 'Dataset deleted successfully' });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

const insertContents = async (req: Request, res: Response): Promise<void> => {
  try {
    const message = await dataServices.insertContents(req);
    res.status(201).json({ message });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

export { getAllDatasets, createDataset, deleteDatasetByName, updateDatasetByName, insertContents };
