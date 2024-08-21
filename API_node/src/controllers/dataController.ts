import { Request, Response } from 'express';
import * as DatasetDAO from '../dao/dao';
import fs from 'fs';
import unzipper from 'unzipper';

const createDataset = async (req: Request, res: Response): Promise<void> => {
  //TODO: Modificare gestione risposte ed errori e mettere funzionalità nel service e eliminare/ricercare per nome
  try {
    if (!req.user?.email) 
      return res.status(400).json({ message: "User email is not available" });
    const { datasetName} = req.body;
    // Verifica che non esista già un dataset con lo stesso nome
    const existingDataset = await DatasetDAO.default.getDsByName(datasetName, req.user?.email);
    if (existingDataset) {
        return res.status(409).json({ message: 'A dataset with this name already exists' });
    }
    const newDataset = await DatasetDAO.default.create(datasetName, req.user?.email);
    res.status(201).json({
      message: 'Dataset created successfully',
      dataset: newDataset
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create dataset', error: err.message });
  }
};


const getAllDatasets = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.email) {
      return res.status(400).json({ message: "User email is not available" });
    }

    const datasets = await DatasetDAO.default.getAllByUserEmail(req.user.email);
    res.status(200).json(datasets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve datasets', error: error.message });
  }
};


const updateDatasetById = async (req: Request, res: Response): Promise<void> => {
  try {
    const datasetId = req.params.datasetId;
    const { newName } = req.body; 

    if (!req.user?.email) {
      return res.status(400).json({ message: "User email is not available" });
    }

    // Recupera i dettagli del dataset corrente per verificare la proprietà
    const dataset = await DatasetDAO.default.getById(datasetId, req.user?.email);
    if (!dataset) {
      return res.status(404).json({ message: 'Dataset not found' });
    }
    if (dataset.email !== req.user.email) {
      return res.status(403).json({ message: 'Unauthorized to access this dataset' });
    }

    // Controlla se un altro dataset esiste con il nuovo nome
    const existingDataset = await DatasetDAO.default.getById(datasetId, req.user?.email);
    if (existingDataset && existingDataset.datasetId !== datasetId) {
      return res.status(409).json({ message: 'A dataset with this name already exists' });
    }

    // Aggiorna il nome del dataset
    const updatedDataset = await DatasetDAO.default.updateById(datasetId, { name: newName });
    res.status(200).json({ message: 'Dataset updated successfully', dataset: updatedDataset });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update dataset', error: error.message });
  }
};

const deleteDatasetById = async (req: Request, res: Response): Promise<void> => {
  try {
    const datasetId = req.params.datasetId;
    if (!req.user?.email) {
      return res.status(400).json({ message: "User email is not available" });
    }

    const dataset = await DatasetDAO.default.getById(datasetId, req.user?.email);
    if (dataset.email !== req.user.email) {
      return res.status(403).json({ message: 'Unauthorized to delete this dataset' });
    }

    await DatasetDAO.default.deleteById(datasetId);
    res.status(200).json({ message: 'Dataset deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete dataset', error: error.message });
  }
};


const insertContents = async (req: Request, res: Response): Promise<void> => {
    const datasetId = req.params.id; // ID del dataset dal parametro URL

    try {
        const file = req.file; // File caricato accessibile tramite req.file

        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // Gestione dei file zip
        if (file.mimetype === 'application/zip') {
            const extractedPath = `uploads/extracted/${Date.now()}/`; 
            fs.mkdirSync(extractedPath, { recursive: true }); 

            // Estrazione del file zip
            fs.createReadStream(file.path)
                .pipe(unzipper.Extract({ path: extractedPath }))
                .on('close', async () => {
                    const files = fs.readdirSync(extractedPath);
                    for (const fileName of files) {
                        const filePath = `${extractedPath}${fileName}`;
                        await DatasetDAO.default.insertContent(datasetId, filePath);
                    }
                    res.status(201).json({ message: 'Contents from zip added successfully' });
                })
                .on('error', error => {
                    res.status(500).json({ message: 'Failed to unzip and add contents', error: error.message });
                });
        } else {
            // Aggiunta diretta di immagini o video
            await DatasetDAO.default.insertContent(datasetId, file.path);
            res.status(201).json({ message: 'Content uploaded successfully', filePath: file.path });
        }
    } catch (error) {
        
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Failed to upload content', error: error.message });
    }
};

export { getAllDatasets, createDataset, deleteDatasetById, updateDatasetById, insertContents};