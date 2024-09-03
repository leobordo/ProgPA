/**
 * @fileOverview Routes configuration for inference operations.
 *               This file sets up all routes related to initiating, monitoring and removing inference jobs within the application.
 *               It uses various middlewares to parse requests, validate data, and authorize users.
 */
import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';

import * as controller from '../controllers/inferenceController';
import { BodyParserMiddleware } from '../middlewares/uploadMiddleware';
import { AuthorizationMiddleware } from '../middlewares/authMiddleware';
import { Role } from '../models/request';
import { ValidationMiddleware } from '../middlewares/validationMiddleware';
import * as schema from '../middlewares/validationSchemas/requestSchemas';

const router = Router();

// Instantiation of middlewares for body parsing, authorization and validation.
const bodyParser = new BodyParserMiddleware();
const userAuthorization = new AuthorizationMiddleware([Role.Admin, Role.User]);
const inferenceValidation = new ValidationMiddleware(schema.makeInferenceSchema);
const getStatusValidation = new ValidationMiddleware(schema.getJobStatusSchema);
const getResultValidation = new ValidationMiddleware(schema.getJobResultSchema);

/**
 * Default middlewares for all routes in this router. Each request first goes through the
 * BodyParserMiddleware and then the AuthorizationMiddleware if the body parsing succeeds.
 */
userAuthorization.setNext(bodyParser);
router.use((req : Request, res : Response, next : NextFunction) => userAuthorization.handle(req, res, next))

//POST route to make inference on a dataset 
router.post('/', (req : Request, res : Response, next : NextFunction) => inferenceValidation.handle(req, res, next), controller.makeInference);

//GET route to check the state of a job
router.get('/state', (req : Request, res : Response, next : NextFunction) => getStatusValidation.handle(req, res, next), controller.checkState);

//GET route to retrieve the result of an inference job
router.get('/result', (req : Request, res : Response, next : NextFunction) => getResultValidation.handle(req, res, next), controller.getResult);

export default router;