/**
 * @fileOverview Middleware Module for File Upload and Body Parsing.
 *
 * This module defines middleware classes for handling file uploads and parsing request bodies in an Express.js application.
 * It provides the `UploadMiddleware` class for managing file uploads, including filtering and storing files, and the 
 * `BodyParserMiddleware` class for parsing multipart form-data requests. Both middleware classes extend a base `Middleware` 
 * class and utilize the multer library for processing file uploads.
 */

import { Request, Response, NextFunction } from 'express';
import multer, { StorageEngine, FileFilterCallback } from 'multer';
import path from 'path';
import { Middleware } from "./middleware"; 
import { ErrorFactory, ErrorType } from '../utils/errorFactory';

// Type definition for the file filter function used in multer
type FileFilter = (req: Request, file: Express.Multer.File, callback: FileFilterCallback) => void;

/**
 * Middleware class for handling file uploads.
 *
 * This middleware handles the upload of files such as images, videos, or zip files. It defines custom storage settings,
 * file filtering based on MIME types, and error handling during the upload process.
 */
class UploadMiddleware extends Middleware {
    private uploader: multer.Multer;

    constructor() {
        super();
        // Define storage settings for multer
        const storage: StorageEngine = multer.diskStorage({
            destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
                // Set the destination directory for uploaded files
                cb(null, path.resolve('../uploads/')); 
            },
            filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
                // Set the filename for the uploaded file
                cb(null, file.originalname);
            }
        });

        // Define a file filter function to restrict uploads to certain file types
        const fileFilter: FileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
            // Allow image, video, and zip files
            if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype === 'application/zip') {
                cb(null, true);
            } else {
                // Reject unsupported file types
                cb(ErrorFactory.createError(ErrorType.RequestParsingError, "Unsupported file type"));
            }
        };

        // Initialize multer with the defined storage and file filter
        this.uploader = multer({ storage: storage, fileFilter: fileFilter });
    }

    /**
     * Handle the file upload process.
     *
     * This method uses multer to handle single file uploads and manage errors related to file upload.
     * 
     * @param {Request} req - The HTTP request object.
     * @param {Response} res - The HTTP response object.
     * @param {NextFunction} next - The next middleware function in the stack.
     */
    handle(req: Request, res: Response, next: NextFunction): void {
        const upload = this.uploader.single('file');
        upload(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                // Multer error during the file uploading
                next(ErrorFactory.createError(ErrorType.FileUpload, "An error occurred while uploading the file"));
            } else if (err) {
                // FileFilter refuses the file
                next(ErrorFactory.createError(ErrorType.RequestParsingError, err.message));
            } else {
                // No errors occurred
                super.handle(req, res, next);
            }
        });
    }
}

/**
 * Middleware class for parsing multipart form-data requests.
 *
 * This middleware handles requests that contain multipart form-data without file uploads. It uses multer to parse the 
 * request body and manages any errors that occur during the parsing process.
 */
class BodyParserMiddleware extends Middleware {
    private upload: multer.Multer; // Multer instance for handling multipart form-data

    constructor() {
        super();
        // Initialize multer for parsing form-data
        this.upload = multer();
    }

    /**
     * Handle the parsing of multipart form-data.
     *
     * This method uses multer to handle requests containing multipart form-data, excluding file uploads, and 
     * manage any parsing errors.
     * 
     * @param {Request} req - The HTTP request object.
     * @param {Response} res - The HTTP response object.
     * @param {NextFunction} next - The next middleware function in the stack.
     */
    handle(req: Request, res: Response, next: NextFunction): void {
        this.upload.none()(req, res, (err: any) => {
            if (err) {
                // Handle errors during form-data parsing
                next(ErrorFactory.createError(ErrorType.RequestParsingError, "An error occurred while parsing the request"));
            }
            // Proceed to the next middleware if no errors occurred
            super.handle(req, res, next);
        });
    }
}

export { UploadMiddleware, BodyParserMiddleware };