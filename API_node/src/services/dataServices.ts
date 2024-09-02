import * as DatasetDAO from '../dao/datasetDao'; // Import all methods from DatasetDAO
import fs from 'fs'; // Import file system module
import unzipper from 'unzipper'; // Import unzipper module for extracting files
import path from 'path'; // Import path module for handling file paths
import ffmpeg from 'fluent-ffmpeg'; // Import ffmpeg for processing video files
import { ErrorType, ErrorFactory } from '../utils/errorFactory'; // Import error handling utilities
import { checkTokenAvailability, updateTokenBalance } from './tokenManagementService'; // Import token management services
import { TOKEN_COSTS } from '../config/tokenCosts'; // Import token costs configuration
import { Dataset } from '../models/sequelize_model/Dataset'; // Import Dataset model
import { Tag } from '../models/sequelize_model/Tag'; // Import Tag model
import {sequelize} from '../config/sequelize'; // Import sequelize instance

ffmpeg.setFfprobePath('/usr/bin/ffprobe'); // Set the path to ffprobe for ffmpeg

/**
 * Create a new dataset
 * @param datasetName - Name of the dataset
 * @param tags - Tags associated with the dataset
 * @param email - User's email
 * @returns The result of the dataset creation
 */
const createDataset = async (datasetName: string, tags: string[], email: string) => {
    // Check if a dataset with the same name already exists
    const existingDataset = await DatasetDAO.default.getDatasetByName(datasetName, email);

    if (existingDataset) {
        throw ErrorFactory.createError(ErrorType.DuplicateDataset); // Throw error if dataset exists
    }

    try {
        // Create the new dataset in the database
        const newDataset = await DatasetDAO.default.create(datasetName, email);
        if (!newDataset) {
            throw ErrorFactory.createError(ErrorType.DatabaseError);
        }
        if (tags){
            // Add tags to the new dataset
            tags.forEach(async (tag) => {
                await DatasetDAO.default.createTag(newDataset.dataset_id, tag);
            });
        }
         // Create directory for the new dataset
         fs.mkdirSync(newDataset.file_path, { recursive: true });
         const { dataset_id, file_path, dataset_name } = newDataset;
         return { message: 'Dataset created successfully', dataset: { dataset_id, file_path, dataset_name, tags }};
    } catch(err) {
        throw err; // Propagate error if dataset creation fails
    }
};

/**
 * Get all datasets by user email
 * @param email - User's email
 * @returns All datasets associated with the email
 */
const getAllDatasets = async (email: string) => {
    // Retrieve all datasets for a user
    try{const datasets: Dataset[] = await DatasetDAO.default.getAllByUserEmail(email);
    const results = [];

    for (const ds of datasets) {
        // Get tags for each dataset
        const tags = await getAllTags(ds);
        const dataset_tags : string[] = []

        for (const tg of tags) {dataset_tags.push(tg.tag)}
        const { dataset_id, file_path, dataset_name, token_cost } = ds;
        results.push({
            dataset: { dataset_id, file_path, dataset_name, token_cost, dataset_tags},
        });
    }

    return results;}
    catch(err){
        throw err
    }
};

/**
 * Update dataset by name
 * @param datasetName - Current name of the dataset
 * @param newName - New name for the dataset
 * @param tags - New tags for the dataset
 * @param email - User's email
 * @returns The updated dataset
 */
const updateDatasetByName = async (datasetName: string, email: string, newName?: string, tags?: string[]) => {
    return await sequelize.transaction(async (transaction: any) => {
        // Get the dataset by name and email
        try{const dataset = await DatasetDAO.default.getDatasetByName(datasetName, email, transaction);
            const allDatasets = await DatasetDAO.default.getAllByUserEmail(email, transaction);
            if (!dataset) {
                throw ErrorFactory.createError(ErrorType.DatasetNotFound); // Throw error if dataset not found
            }

            if (dataset.email !== email) {
                throw ErrorFactory.createError(ErrorType.DatasetNotFound); // Throw error if email mismatch
            }

            for(const ds of allDatasets){
                if (ds.dataset_name === newName) {
                    throw ErrorFactory.createError(ErrorType.DuplicateDataset); // Throw error if new name already exists
                }
            }

            if (newName && dataset.dataset_name === newName) {
                throw ErrorFactory.createError(ErrorType.DuplicateDataset); // Throw error if new name is the same as current
            }

            if (!newName && !tags) {
                throw ErrorFactory.createError(ErrorType.UndefinedRequest); // Throw error if neither newName nor tags are provided
            }
            // Update dataset name if newName is provided
            if (!tags) {
                    await DatasetDAO.default.updateDsByName(datasetName, email, newName, transaction);
                    return "Name correctly updated";
                }

                // Update tags if provided
            if (!newName) {
                    await DatasetDAO.default.deleteTagsbyId(dataset.dataset_id, transaction);
                    for(const tag of tags) {
                        await DatasetDAO.default.createTag(dataset.dataset_id, tag, transaction);
                    }
                    return "Tags correctly updated";
                }

                // Update both dataset name and tags
            await DatasetDAO.default.updateDsByName(datasetName, email, newName, transaction);
            await DatasetDAO.default.deleteTagsbyId(dataset.dataset_id, transaction);
            for(const tag of tags) {
                await DatasetDAO.default.createTag(dataset.dataset_id, tag, transaction);
                }
            return "Name and Tags correctly updated";
        } catch(err) {
        throw err; // Propagate error if update fails
        }
    });
};

/**
 * Delete dataset by name
 * @param datasetName - Name of the dataset to delete
 * @param email - User's email
 */
const deleteDatasetByName = async (datasetName: string, email: string) => {
   try{ // Get the dataset by name and email
    const dataset = await DatasetDAO.default.getDatasetByName(datasetName, email);

    if (!dataset) {
        throw ErrorFactory.createError(ErrorType.DatasetNotFound); // Throw error if dataset not found
    }

    if (dataset.email !== email) {
        throw ErrorFactory.createError(ErrorType.DatasetNotFound); // Throw error if email mismatch
    }

    // Soft delete the dataset by marking it as deleted
    return await DatasetDAO.default.softDeleteByName(datasetName, email);
    }catch(err){
        throw err
    }
};

/**
 * Insert contents into a dataset
 * @param datasetName - Name of the dataset
 * @param file - File to insert
 * @param email - User's email
 * @returns Success message
 */
const insertContents = async (datasetName: string, file: Express.Multer.File, email: string) => {
    try{// Get the dataset by name and email
    const dataset = await DatasetDAO.default.getDatasetByName(datasetName, email);
    if (!dataset) {
        throw ErrorFactory.createError(ErrorType.DatasetNotFound); // Throw error if dataset not found
    }

    const datasetFilePath = dataset.file_path;
    const originalFilesPath = path.join(datasetFilePath, 'original_files');
 
    // Check if original files directory exists, create if not
    if (!fs.existsSync(originalFilesPath)) {
        try {
            fs.mkdirSync(originalFilesPath, { recursive: true });
        } catch (err) {
            throw ErrorFactory.createError(ErrorType.DirectoryCreation); // Throw error if directory creation fails
        }
    }

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv']; 
    let totalTokenCost: number = 0;
    let totalTokenCostInference: number = 0;

    if (file.mimetype === 'application/zip') {
        const extractedPath = path.join(originalFilesPath, `${Date.now()}/`);
        fs.mkdirSync(extractedPath, { recursive: true });

        let blockedFiles: string[] = []; 
        
        try {
            // Extract files from the uploaded zip
            await new Promise<void>((resolve, reject) => {
                fs.createReadStream(file.path)
                    .pipe(unzipper.Extract({ path: extractedPath }))
                    .on('close', resolve)
                    .on('error', reject);
            });

            const files = fs.readdirSync(extractedPath);
            for (const fileName of files) {
                const extractedFilePath = path.join(extractedPath, fileName);
                const fileExtension = path.extname(fileName).toLowerCase();
                
                if (allowedExtensions.includes(fileExtension)) {
                    const finalFilePath = path.join(originalFilesPath, fileName);
                    fs.renameSync(extractedFilePath, finalFilePath);
                    
                    // Calculate token cost based on file type
                    if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'].includes(fileExtension)) {
                        const frameCount = await getVideoFrameCount(finalFilePath); // Function to calculate frame count
                        totalTokenCost += frameCount * TOKEN_COSTS.FRAME_VIDEO_UPLOADING;
                        totalTokenCostInference += frameCount * TOKEN_COSTS.FRAME_VIDEO_INFERENCE;
                    } else {
                        totalTokenCost += TOKEN_COSTS.IMAGE_UPLOADING;
                        totalTokenCostInference += TOKEN_COSTS.IMAGE_INFERENCE;
                    }
                } else {
                    blockedFiles.push(fileName); // Add blocked file to list
                }
            }
            
            // Check if user has enough tokens
            const hasEnoughTokens = await checkTokenAvailability(email, totalTokenCost);
            
            if (!hasEnoughTokens) {
                // Clean up if not enough tokens
                fs.rmSync(extractedPath, { recursive: true, force: true });
                fs.rmSync(file.path, { recursive: true, force: true });
                throw ErrorFactory.createError(ErrorType.InsufficientTokens);
            }
            
            // Deduct tokens
            await updateTokenBalance(email, -totalTokenCost);
            // Update token cost on dataset
            
            await DatasetDAO.default.updateTokenCostByName(dataset.dataset_name, dataset.email, dataset.token_cost, totalTokenCostInference);

            // Clean up extracted files and uploaded zip
            fs.rmSync(extractedPath, { recursive: true, force: true });
            fs.rmSync(file.path, { recursive: true, force: true });
        } catch (err: any) {
            if (err.status === 402){
                throw err; 
            }
            throw ErrorFactory.createError(ErrorType.FileUpload); // Throw error if file upload fails
        }

        if (blockedFiles.length > 0) {
            return `Contents from zip added successfully. Blocked files: ${blockedFiles.length} (${blockedFiles.join(', ')})`;
        } else {
            return 'Contents from zip added successfully and extraction directory removed';
        }
    } else {
        // Calculate token cost for single file
        if (file.mimetype.startsWith('video/')) {
            const frameCount = await getVideoFrameCount(file.path); // Function to calculate frame count
            totalTokenCost = frameCount * TOKEN_COSTS.FRAME_VIDEO_UPLOADING;
            totalTokenCostInference = frameCount * TOKEN_COSTS.FRAME_VIDEO_INFERENCE;
        } else if (file.mimetype.startsWith('image/')) {
            totalTokenCost = TOKEN_COSTS.IMAGE_UPLOADING;
            totalTokenCostInference = TOKEN_COSTS.IMAGE_INFERENCE;
        }

        try {
            // Check if user has enough tokens
            const hasEnoughTokens = await checkTokenAvailability(email, totalTokenCost);
            if (!hasEnoughTokens) {
                fs.rmSync(file.path, { recursive: true, force: true });
                throw ErrorFactory.createError(ErrorType.InsufficientTokens);
            }
            
            // Deduct tokens
            await updateTokenBalance(email, -totalTokenCost);
            await DatasetDAO.default.updateTokenCostByName(dataset.dataset_name, dataset.email, dataset.token_cost, totalTokenCostInference);
        } catch (err) {
            throw err;
        }
        

        

        // Move file to final destination
        const finalFilePath = path.join(originalFilesPath, file.filename);
        fs.renameSync(file.path, finalFilePath);
        return 'Content uploaded successfully';
    }}catch(err){
        throw err
    }
};

/**
 * Get the frame count of a video file
 * @param videoPath - Path to the video file
 * @returns Promise<number> - Number of frames in the video
 */
const getVideoFrameCount = (videoPath: string): Promise<number> => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoPath, (err: Error | null, metadata: ffmpeg.FfprobeData) => {
            if (err) {
                return reject(ErrorFactory.createError(ErrorType.FrameCount)); // Reject promise if error occurs
            }
            
            const stream = metadata.streams.find((stream: ffmpeg.FfprobeStream) => stream.codec_type === 'video');
            
            if (stream && stream.nb_frames) {
                resolve(parseInt(stream.nb_frames, 10)); // Resolve promise with frame count if available
            } else {
                // Estimate frame count using duration and frame rate if nb_frames is not available
                if (stream && stream.duration && stream.r_frame_rate) {
                    const [numerator, denominator] = stream.r_frame_rate.split('/').map(Number);
                    const frameRate = numerator / denominator;
                    const duration = parseFloat(stream.duration);
                    resolve(Math.round(frameRate * duration));
                } else {
                    reject(ErrorFactory.createError(ErrorType.FrameCount)); 
                }
            }
        });
    });
};

/**
 * Get all tags associated with a specific dataset
 * @param dataset - The dataset object for which to retrieve tags
 * @returns An array of tags associated with the dataset
 */
const getAllTags = async (dataset: Dataset) => {
    try{return await DatasetDAO.default.getTags(dataset.dataset_id);} // Retrieve tags for the dataset
    catch(err){
        throw err;
    }
};

// Export functions for use in other modules
export { createDataset, getAllDatasets, insertContents, deleteDatasetByName, updateDatasetByName, getAllTags };
