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
const inferenceValidation = new ValidationMiddleware([schema.userSchema, schema.datasetNameSchema, schema.detectionModelSchema]);
const jobIdValidation = new ValidationMiddleware([schema.userSchema, schema.jobIdSchema]);

bodyParser.setNext(userAuthorization);

//All the routes in this router use BodyParserMiddleware and userAuthorization with the same configuration
router.use((req : Request, res : Response, next : NextFunction) => bodyParser.handle(req, res, next))

//route to make inference on a dataset 
router.post('/', (req : Request, res : Response, next : NextFunction) => inferenceValidation.handle(req, res, next), controller.makeInference);

//route to check the state of a job
router.get('/state', (req : Request, res : Response, next : NextFunction) => jobIdValidation.handle(req, res, next), controller.checkState);

//route to retrieve the result of an inference
router.get('/result', (req : Request, res : Response, next : NextFunction) => jobIdValidation.handle(req, res, next), controller.getResult);

export default router;