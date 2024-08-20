import { Request, Response } from 'express';

// Funzione per gestire la richiesta POST /predictVideo
const createDataset = async (req: Request, res: Response): Promise<void> => {
    //...
  };

// Funzione per gestire la richiesta POST /predictImage
const getAllDatasets = async (req: Request, res: Response): Promise<void> => {
    //...
  };

// Funzione per gestire la richiesta POST /predictVideo
const updateDatasetById = async (req: Request, res: Response): Promise<void> => {
    //...
  };

// Funzione per gestire la richiesta POST /predictVideo
const deleteDatasetById = async (req: Request, res: Response): Promise<void> => {
    //...
  };

// Funzione per gestire la richiesta POST /predictVideo
const insertContents = async (req: Request, res: Response): Promise<void> => {
    //...
  };

export { getAllDatasets, createDataset, deleteDatasetById, updateDatasetById, insertContents};