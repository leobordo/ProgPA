import * as DatasetDAO from '../dao/datasetDao';
import fs from 'fs';
import unzipper from 'unzipper';
import path from 'path';
import { Role, AuthenticatedRequest } from '../models/request';
import { ErrorType, ErrorFactory } from './errorFactory';

const createDataset = async (req: AuthenticatedRequest) => {
    if (!req.auth?.payload?.email) {
        throw ErrorFactory.createError(ErrorType.Authentication);
    }
    
    const { datasetName, tags } = req.body;
    const email = req.auth?.payload?.email;

    const existingDataset = await DatasetDAO.default.getDsByName(datasetName, email);
    if (existingDataset) {
        throw ErrorFactory.createError(ErrorType.DuplicateDataset);
    }

    const maxDatasetId = await DatasetDAO.default.getMaxDatasetId();
    const datasetDir = path.join('./uploads', String(maxDatasetId));

    try {
        fs.mkdirSync(datasetDir, { recursive: true });
    } catch (err) {
        throw ErrorFactory.createError(ErrorType.DirectoryCreation);
    }

    const newDataset = await DatasetDAO.default.create(datasetName, email, datasetDir, tags);
    return { message: 'Dataset created successfully', dataset: newDataset };
};

const getAllDatasets = async (req: AuthenticatedRequest) => {
    if (!req.auth?.payload?.email) {
        throw ErrorFactory.createError(ErrorType.Authentication);
    }

    return await DatasetDAO.default.getAllByUserEmail(req.auth?.payload?.email);
};

const updateDatasetByName = async (req: AuthenticatedRequest) => {
    const datasetName = req.body.datasetName;
    const newName = req.body.newDatasetName;
    const email = req.auth?.payload?.email;

    if (!email) {
        throw ErrorFactory.createError(ErrorType.Authentication);
    }

    const dataset = await DatasetDAO.default.getDsByName(datasetName, email);
    if (!dataset) {
        throw ErrorFactory.createError(ErrorType.DatasetNotFound);
    }

    if (dataset.email !== email) {
        throw ErrorFactory.createError(ErrorType.Authorization);
    }

    if (dataset.datasetName === newName) {
        throw ErrorFactory.createError(ErrorType.DuplicateDataset);
    }

    return await DatasetDAO.default.updateByName(datasetName, email, { name: newName });
};

const deleteDatasetByName = async (req: AuthenticatedRequest) => {
    const datasetName = req.body.datasetName;
    const email = req.auth?.payload?.email;

    if (!email) {
        throw ErrorFactory.createError(ErrorType.Authentication);
    }

    return await DatasetDAO.default.softDeleteByName(datasetName, email);
};

const insertContents = async (req: AuthenticatedRequest) => {
    const datasetName = req.body.datasetName;
    const file = req.file;

    if (req.auth?.payload?.email == undefined) {
        throw ErrorFactory.createError(ErrorType.Authentication);
    }

    const dataset = await DatasetDAO.default.getDsByName(datasetName, req.auth.payload.email);
    if (!dataset) {
        throw ErrorFactory.createError(ErrorType.DatasetNotFound);
    }

    const datasetFilePath = dataset.filePath;

    if (!file) {
        throw ErrorFactory.createError(ErrorType.FileUpload);
    }

    const originalFilesPath = path.join(datasetFilePath, 'original_files');
    
    if (!fs.existsSync(originalFilesPath)) {
        try {
            fs.mkdirSync(originalFilesPath, { recursive: true });
        } catch (err) {
            throw ErrorFactory.createError(ErrorType.DirectoryCreation);
        }
    }

    if (file.mimetype === 'application/zip') {
        const extractedPath = path.join(originalFilesPath, `${Date.now()}/`);
        fs.mkdirSync(extractedPath, { recursive: true });

        try {
            await new Promise<void>((resolve, reject) => {
                fs.createReadStream(file.path)
                    .pipe(unzipper.Extract({ path: extractedPath }))
                    .on('close', resolve)
                    .on('error', reject);
            });

            const files = fs.readdirSync(extractedPath);
            for (const fileName of files) {
                const extractedFilePath = path.join(extractedPath, fileName);
                const finalFilePath = path.join(originalFilesPath, fileName);
                fs.renameSync(extractedFilePath, finalFilePath);
            }

            fs.rmSync(extractedPath, { recursive: true, force: true });
        } catch (err) {
            throw ErrorFactory.createError(ErrorType.FileUpload);
        }

        return 'Contents from zip added successfully and extraction directory removed';
    } else {
        const finalFilePath = path.join(originalFilesPath, file.filename);
        fs.renameSync(file.path, finalFilePath);
        return 'Content uploaded successfully';
    }
};

export { createDataset, getAllDatasets, insertContents, deleteDatasetByName, updateDatasetByName };
