import { Request, Response, NextFunction } from 'express';
import multer, { StorageEngine, FileFilterCallback } from 'multer';
import path from 'path';
import { Middleware } from "./middleware"; 
import { ErrorFactory, ErrorType } from '../utils/errorFactory';


type FileFilter = (req: Request, file: Express.Multer.File, callback: FileFilterCallback) => void;

class UploadMiddleware extends Middleware {
    private uploader: multer.Multer;

    constructor() {
        super();
        const storage: StorageEngine = multer.diskStorage({
            destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
                cb(null, path.resolve('../uploads/')); 
            },
            filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
                //const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                cb(null, file.originalname);
            }
        });

        const fileFilter: FileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
            if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype === 'application/zip') {
                cb(null, true);
            } else {
                cb(ErrorFactory.createError(ErrorType.RequestParsingError, "Unsupported file type"));
            }
        };

        this.uploader = multer({ storage: storage, fileFilter: fileFilter });
    }

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

class BodyParserMiddleware extends Middleware {
    private upload: multer.Multer;

    constructor() {
        super();
        this.upload = multer();
    }

    handle(req: Request, res: Response, next: NextFunction): void {
        this.upload.none()(req, res, (err: any) => {
            if (err) {
                next(ErrorFactory.createError(ErrorType.RequestParsingError, "An error occurred while parsing the request"));
            }
            super.handle(req, res, next);
        });
    }
}

export { UploadMiddleware, BodyParserMiddleware };