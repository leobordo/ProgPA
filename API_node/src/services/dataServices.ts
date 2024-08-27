import * as DatasetDAO from '../dao/datasetDao';
import fs from 'fs';
import unzipper from 'unzipper';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { ErrorType, ErrorFactory } from './errorFactory';
import { checkTokenAvailability, updateTokenBalance } from './tokenManagementService';

ffmpeg.setFfprobePath('/usr/bin/ffprobe');
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

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv']; 
    let totalTokenCost = 0;

    if (file.mimetype === 'application/zip') {
        const extractedPath = path.join(originalFilesPath, `${Date.now()}/`);
        fs.mkdirSync(extractedPath, { recursive: true });

        let blockedFiles: string[] = []; 
        
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
                const fileExtension = path.extname(fileName).toLowerCase();
                
                if (allowedExtensions.includes(fileExtension)) {
                    const finalFilePath = path.join(originalFilesPath, fileName);
                    fs.renameSync(extractedFilePath, finalFilePath);
                    
                    // Calculate token cost
                    if (fileExtension === '.mp4' || fileExtension === '.avi' || fileExtension === '.mov' || fileExtension === '.wmv' || fileExtension === '.flv' || fileExtension === '.mkv') {
                        
                        const frameCount = await getVideoFrameCount(finalFilePath); // Function to calculate frame count
                        totalTokenCost += frameCount * 0.5;
                    } else {
                        totalTokenCost += 0.75;
                    }
                } else {
                    blockedFiles.push(fileName); 
                }
            }
            
            // Check if user has enough tokens
            const hasEnoughTokens = await checkTokenAvailability(email, totalTokenCost);
            
            if (!hasEnoughTokens) {
                console.log("ok")
                // Clean up if not enough tokens
                fs.rmSync(extractedPath, { recursive: true, force: true });
                fs.rmSync(file.path, { recursive: true, force: true });
                console.log("ok")
                throw ErrorFactory.createError(ErrorType.InsufficientTokens);
            }
            
            // Deduct tokens
            await updateTokenBalance(email, -totalTokenCost);
            
            fs.rmSync(extractedPath, { recursive: true, force: true });
            fs.rmSync(file.path, { recursive: true, force: true });
        } catch (err : any) {
            if (err.message == "Insufficient tokens to complete request"){
                throw err
            }
            throw ErrorFactory.createError(ErrorType.FileUpload);
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
            totalTokenCost = frameCount * 0.5;
        } else if (file.mimetype.startsWith('image/')) {
            totalTokenCost = 0.75;
        }

        // Check if user has enough tokens
        const hasEnoughTokens = await checkTokenAvailability(email, totalTokenCost);
        if (!hasEnoughTokens) {
            fs.rmSync(file.path, { recursive: true, force: true })
            throw ErrorFactory.createError(ErrorType.InsufficientTokens);
        }

        // Deduct tokens
        await updateTokenBalance(email, -totalTokenCost);

        const finalFilePath = path.join(originalFilesPath, file.filename);
        fs.renameSync(file.path, finalFilePath);
        return 'Content uploaded successfully';
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
                console.error('ffprobe error:', err);
                return reject(err);
            }
            
            const stream = metadata.streams.find((stream: ffmpeg.FfprobeStream) => stream.codec_type === 'video');
            
            if (stream && stream.nb_frames) {
                resolve(parseInt(stream.nb_frames, 10));
            } else {
                // If nb_frames is not available, estimate frame count using duration and frame rate
                if (stream && stream.duration && stream.r_frame_rate) {
                    const [numerator, denominator] = stream.r_frame_rate.split('/').map(Number);
                    const frameRate = numerator / denominator;
                    const duration = parseFloat(stream.duration);
                    resolve(Math.round(frameRate * duration));
                } else {
                    reject(new Error('Unable to determine frame count'));
                }
            }
        });
    });
};






export { createDataset, getAllDatasets, insertContents, deleteDatasetByName, updateDatasetByName};
