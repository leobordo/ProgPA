import { Request } from 'express';
import * as DatasetDAO from '../dao/dao';
import fs from 'fs';
import unzipper from 'unzipper';
import path from 'path';
import { Role, AuthenticatedRequest } from '../models/request';

const createDataset = async (req: AuthenticatedRequest) => {
  if (!req.auth?.payload?.email) {
    throw new Error("User email is not available");
  }
  
  const { datasetName } = req.body.datasetName;
  const email = req.auth?.payload?.email;

  const existingDataset = await DatasetDAO.default.getDsByName(datasetName, email);
  if (existingDataset) {
    throw new Error('A dataset with this name already exists');
  }

  // Creazione della directory per il dataset
  const datasetDir = path.join('./uploads', datasetName);
  fs.mkdirSync(datasetDir, { recursive: true });

  const newDataset = await DatasetDAO.default.create(datasetName, email, datasetDir);
  return { message: 'Dataset created successfully', dataset: newDataset };
};

const getAllDatasets = async (req: AuthenticatedRequest) => {
  if (!req.auth?.payload?.email) {
    throw new Error("User email is not available");
  }

  return await DatasetDAO.default.getAllByUserEmail(req.auth?.payload?.email);
};

const updateDatasetByName = async (req: AuthenticatedRequest) => {
  const datasetName = req.body.datasetName;
  const newName = req.body.newDatasetName;
  const email = req.auth?.payload?.email;

  if (!email) {
    throw new Error("User email is not available");
  }

  const dataset = await DatasetDAO.default.getDsByName(datasetName, email);
  if (!dataset) {
    throw new Error('Dataset not found');
  }

  if (dataset.email !== email) {
    throw new Error('Unauthorized to access this dataset');
  }

  if (dataset.datasetName === newName) {
    throw new Error('A dataset with this name already exists');
  }

  return await DatasetDAO.default.updateByName(datasetName, email, { name: newName });
};

const deleteDatasetByName = async (req: AuthenticatedRequest) => {
  const datasetName = req.body.datasetName;
  const email = req.auth?.payload?.email;

  if (!email) {
    throw new Error("User email is not available");
  }

  // Eliminazione logica: imposta isDeleted a true
  return await DatasetDAO.default.softDeleteByName(datasetName, email);
};

const insertContents = async (req: AuthenticatedRequest) => {
    const datasetName = req.body.datasetName;
    const file = req.file;
    if(req.auth?.payload?.email == undefined) {throw new Error('Unexpected error while taking email from request')}
    const dataset = await DatasetDAO.default.getDsByName(datasetName, req.auth?.payload?.email);
    if(!dataset) 
    {throw new Error("Dataset does not exist")}
    const datasetId = Number(dataset.datasetId);
  
    if (!file) {
      throw new Error("No file uploaded");
    }
  
    if (file.mimetype === 'application/zip') {
      const extractedPath = path.join(dataset?.filePath, `${Date.now()}/`);
      fs.mkdirSync(extractedPath, { recursive: true });
  
      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(file.path)
          .pipe(unzipper.Extract({ path: extractedPath }))
          .on('close', resolve)
          .on('error', reject);
      });
  
      const files = fs.readdirSync(extractedPath);
      for (const fileName of files) {
        const filePath = path.join(extractedPath, fileName);
        await DatasetDAO.default.insertContent(datasetName, datasetId, filePath);
      }
  
      // Rimuove la directory di estrazione dopo aver elaborato tutti i file
      fs.rmSync(extractedPath, { recursive: true, force: true });
  
      return 'Contents from zip added successfully and extraction directory removed';
    } else {
      const finalFilePath = path.join(dataset.filePath, file.filename);
      fs.renameSync(file.path, finalFilePath);
      await DatasetDAO.default.insertContent(datasetName, datasetId, finalFilePath);
      return 'Content uploaded successfully';
    }
  };

export {createDataset, getAllDatasets, insertContents, deleteDatasetByName, updateDatasetByName};