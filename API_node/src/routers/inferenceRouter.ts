import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import * as controller from '../controllers/inferenceController';
import { BodyParserMiddleware } from '../middlewares/uploadMiddleware';
import { AuthorizationMiddleware } from '../middlewares/authMiddleware';
import { Role } from '../models/request';
import { ValidationMiddleware } from '../middlewares/bodyValidationMiddleware';
import * as schema from '../middlewares/validationSchemas/bodyValidationSchemas';

const router = Router();

// Middleware instantiation and concatenation
const bodyParser = new BodyParserMiddleware();
const userAuthorization = new AuthorizationMiddleware([Role.Admin, Role.User]);
const inferenceValidation = new ValidationMiddleware(schema.makeInferenceSchema);
const getStatusValidation = new ValidationMiddleware(schema.getJobStatusSchema);
const getResultValidation = new ValidationMiddleware(schema.getJobResultSchema);

bodyParser.setNext(userAuthorization);

//All the routes in this router use BodyParserMiddleware and userAuthorization with the same configuration
router.use((req : Request, res : Response, next : NextFunction) => bodyParser.handle(req, res, next))

//route to make inference on a dataset 
router.post('/', (req : Request, res : Response, next : NextFunction) => inferenceValidation.handle(req, res, next), controller.makeInference);

//route to check the state of a job
router.get('/state', (req : Request, res : Response, next : NextFunction) => getStatusValidation.handle(req, res, next), controller.checkState);

//route to retrieve the result of an inference
router.get('/result', (req : Request, res : Response, next : NextFunction) => getResultValidation.handle(req, res, next), controller.getResult);

export default router;