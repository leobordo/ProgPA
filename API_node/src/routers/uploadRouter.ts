/**
 * @fileOverview Routes configuration for upload operations.
 *               It uses various middlewares to parse requests, validate data, and authorize users.
 */
import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import * as controller from '../controllers/dataController';

import { AuthorizationMiddleware } from '../middlewares/authMiddleware';
import { UploadMiddleware } from '../middlewares/uploadMiddleware';
import { ValidationMiddleware } from '../middlewares/validationMiddleware';
import { Role } from '../models/request';
import * as schema from '../middlewares/validationSchemas/requestSchemas';

const router = Router();

// Instantiation of middlewares for body parsing, authorization and validation.
const uploadMiddleware = new UploadMiddleware();
const userAuthorization = new AuthorizationMiddleware([Role.Admin, Role.User]);
const validation = new ValidationMiddleware(schema.uploadContentsSchema);
userAuthorization.setNext(uploadMiddleware).setNext(validation);

//POST route to insert a new content (image, video or zip) in a specified dataset (by dataset id)
router.post('/', (req : Request, res : Response, next : NextFunction) => userAuthorization.handle(req, res, next), controller.insertContents);

export default router;