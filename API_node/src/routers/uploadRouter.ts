import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import * as controller from '../controllers/dataController';
import { AuthorizationMiddleware } from '../middlewares/authMiddleware';
import { UploadMiddleware } from '../middlewares/uploadMiddleware';
import { ValidationMiddleware } from '../middlewares/bodyValidationMiddleware';
import { Role } from '../models/request';
import * as schema from '../middlewares/validationSchemas/bodyValidationSchemas';

const router = Router();

// Middleware instantiation and concatenation
const uploadMiddleware = new UploadMiddleware();
const userAuthorization = new AuthorizationMiddleware([Role.Admin, Role.User]);
const validation = new ValidationMiddleware(schema.uploadContentsSchema);
uploadMiddleware.setNext(userAuthorization).setNext(validation);

//route to insert a new content in a specified dataset (through the dataset id)
router.post('/', (req : Request, res : Response, next : NextFunction) => uploadMiddleware.handle(req, res, next), controller.insertContents);

export default router;