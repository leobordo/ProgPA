import * as DatasetDAO from '../dao/datasetDao';
import fs from 'fs';
import unzipper from 'unzipper';
import path from 'path';
import { ErrorType, ErrorFactory } from './errorFactory';

/**
 * Create a new dataset
 * @param datasetName - Name of the dataset
 * @param tags - Tags associated with the dataset
 * @param email - User's email
 * @returns The result of the dataset creation
 */
const createDataset = async (datasetName: string, tags: string, email: string) => {
    const existingDataset = await DatasetDAO.default.getDsByName(datasetName, email);

    if (existingDataset) {
        throw ErrorFactory.createError(ErrorType.DuplicateDataset);
    }

    let maxDatasetId = await DatasetDAO.default.getMaxDatasetId();
    if (maxDatasetId === null) { maxDatasetId = "0"; }
    const datasetDir = path.join('./uploads', (parseInt(maxDatasetId as string, 10) + 1).toString());

    try {
        fs.mkdirSync(datasetDir, { recursive: true });
    } catch (err) {
        throw ErrorFactory.createError(ErrorType.DirectoryCreation);
    }

    const newDataset = await DatasetDAO.default.create(datasetName, email, datasetDir, tags);
    return { message: 'Dataset created successfully', dataset: newDataset };
};

/**
 * Get all datasets by user email
 * @param email - User's email
 * @returns All datasets associated with the email
 */
const getAllDatasets = async (email: string) => {
    return await DatasetDAO.default.getAllByUserEmail(email);
};

/**
 * Update dataset by name
 * @param datasetName - Current name of the dataset
 * @param newName - New name for the dataset
 * @param tags - New tags for the dataset
 * @param email - User's email
 * @returns The updated dataset
 */
const updateDatasetByName = async (datasetName: string, newName: string , tags: string, email: string) => {
    const dataset = await DatasetDAO.default.getDsByName(datasetName, email);

    if (!dataset) {
        throw ErrorFactory.createError(ErrorType.DatasetNotFound);
    }

    if (dataset.email !== email) {
        throw ErrorFactory.createError(ErrorType.Authorization);
    }

    if (newName && dataset.dataset_name === newName) {
        throw ErrorFactory.createError(ErrorType.DuplicateDataset);
    }

    if (!newName && !tags) {
        throw ErrorFactory.createError(ErrorType.UndefinedRequest)
    }

    return await DatasetDAO.default.updateByName(datasetName, email, newName, tags);
};

/**
 * Delete dataset by name
 * @param datasetName - Name of the dataset to delete
 * @param email - User's email
 */
const deleteDatasetByName = async (datasetName: string, email: string) => {
    const dataset = await DatasetDAO.default.getDsByName(datasetName, email);

    if (!dataset) {
        throw ErrorFactory.createError(ErrorType.DatasetNotFound);
    }
    return await DatasetDAO.default.softDeleteByName(datasetName, email);
};

/**
 * Insert contents into a dataset
 * @param datasetName - Name of the dataset
 * @param file - File to insert
 * @param email - User's email
 * @returns Success message
 */
const insertContents = async (datasetName: string, file: Express.Multer.File, email: string) => {
    const dataset = await DatasetDAO.default.getDsByName(datasetName, email);

    if (!dataset) {
        throw ErrorFactory.createError(ErrorType.DatasetNotFound);
    }

    const datasetFilePath = dataset.file_path;
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
            fs.rmSync(file.path, { recursive: true, force: true });
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

// dataServices.ts

/**
 * Validates required parameters and throws an error if any are missing.
 * @param params An object containing key-value pairs of parameters to check.
 * @param requiredParams Array of strings specifying keys to check in the params object.
 */
const validateRequiredParams = (params: { [key: string]: any }, requiredParams: string[]): void => {
    let missingParams = requiredParams.filter(param => !params[param]);

    if (missingParams.length > 0) {
        throw ErrorFactory.createError(ErrorType.MissingParameters,"", missingParams );
    }
}


export { createDataset, getAllDatasets, insertContents, deleteDatasetByName, updateDatasetByName, validateRequiredParams };
