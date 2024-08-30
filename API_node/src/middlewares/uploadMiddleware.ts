import { Request, Response, NextFunction } from 'express';
import multer, { StorageEngine, FileFilterCallback } from 'multer';
import path from 'path';
import { Middleware } from "./middleware"; 


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
                const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
            }
        });

        const fileFilter: FileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
            if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype === 'application/zip') {
                cb(null, true);
            } else {
                cb(new Error('Unsupported file type'));
            }
        };

        this.uploader = multer({ storage: storage, fileFilter: fileFilter });
    }

    handle(req: Request, res: Response, next: NextFunction): void {
        const upload = this.uploader.single('file');  // o .array(), .fields(), etc., a seconda delle tue necessità
        upload(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                // Un errore di Multer quando si carica un file
                res.status(500).send({ error: err.message });
            } else if (err) {
                // Un errore generico se il fileFilter rifiuta il file
                res.status(400).send({ error: err.message });
            } else {
                // Se non ci sono errori, procedi al prossimo middleware nella catena
                super.handle(req, res, next);
            }
        });
    }
}

class BodyParserMiddleware extends Middleware {
    private upload: multer.Multer;

    constructor() {
        super();
        // Configura multer senza salvataggio di file
        this.upload = multer();
    }

    handle(req: Request, res: Response, next: NextFunction): void {
        // Processa solo dati form-data senza file

        this.upload.none()(req, res, (err: any) => {
            if (err) {
                // Gestisci gli errori di Multer
                return res.status(400).send(`Error processing data: ${err.message}`);
            }
            // Procedi al prossimo middleware se non ci sono errori


            super.handle(req, res, next);
        });
    }
}

export { UploadMiddleware, BodyParserMiddleware };