import * as DatasetDAO from '../dao/datasetDao';
import fs from 'fs';
import unzipper from 'unzipper';
import path from 'path';
import { ErrorType, ErrorFactory } from './errorFactory';
import { Request } from 'express';

const createDataset = async (req: Request) => {
    
    if (!req.user!.userEmail) {
        //throw ErrorFactory.createError(ErrorType.Authentication);
        
    }
    
    const dataset_name= req.body.datasetName;
    const tags = req.body.tags
    const email = req.user!.userEmail;

    //TROVA CON is_deleted=false
    const existingDataset = await DatasetDAO.default.getDsByName(dataset_name, email);
    
    if (existingDataset) {
        throw ErrorFactory.createError(ErrorType.DuplicateDataset);
    }

    var maxDatasetId = await DatasetDAO.default.getMaxDatasetId();
    console.log(maxDatasetId)
    if(maxDatasetId==null){maxDatasetId="0"}
    const datasetDir = path.join('./uploads', (parseInt(maxDatasetId as string,10)+1).toString());

    try {
        fs.mkdirSync(datasetDir, { recursive: true });
    } catch (err) {
        throw ErrorFactory.createError(ErrorType.DirectoryCreation);
    }

    const newDataset = await DatasetDAO.default.create(dataset_name, email, datasetDir, tags);
    return { message: 'Dataset created successfully', dataset: newDataset };
};

const getAllDatasets = async (req: Request) => {
    if (!req.user!.userEmail) {
        throw ErrorFactory.createError(ErrorType.Authentication);
    }

    return await DatasetDAO.default.getAllByUserEmail(req.user!.userEmail);
};


const updateDatasetByName = async (req: Request) => {
    const datasetName = req.body.datasetName;
    const newName = req.body.newDatasetName;
    const tags = req.body.newTags;
    const email = req.user!.userEmail;

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

    if (dataset.dataset_name === newName) {
        throw ErrorFactory.createError(ErrorType.DuplicateDataset);
    }
    if (newName==null && tags==null){
        throw new Error("non stai modificando nulla")
    }
    console.log("OK")
    return await DatasetDAO.default.updateByName(datasetName, email, newName, tags);
};


const deleteDatasetByName = async (req: Request) => {
    const datasetName = req.body.datasetName;
    const email = req.user!.userEmail;

    if (!email) {
        throw ErrorFactory.createError(ErrorType.Authentication);
    }

    return await DatasetDAO.default.softDeleteByName(datasetName, email);
};


const insertContents = async (req: Request) => {
    
    const datasetName = req.body.datasetName;
    const file = req.file;
    console.log(req.body.datasetName)
    if (req.user!.userEmail == undefined) {
        throw ErrorFactory.createError(ErrorType.Authentication);
    }
    const dataset = await DatasetDAO.default.getDsByName(datasetName, req.user!.userEmail);
    console.log("gg")
    if (!dataset) {
        throw ErrorFactory.createError(ErrorType.DatasetNotFound);
    }

    const datasetFilePath = dataset.file_path;

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
            fs.rmSync(file.path, {recursive: true, force: true});
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
