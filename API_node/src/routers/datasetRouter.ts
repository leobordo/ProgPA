import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import * as controller from '../controllers/dataController';
import { AuthenticationMiddleware, AuthorizationMiddleware } from '../middlewares/authMiddleware';
import { BodyParserMiddleware } from '../middlewares/uploadMiddleware';
import { ValidationMiddleware } from '../middlewares/bodyValidationMiddleware';
import { Role } from '../models/request';
import * as schema from '../middlewares/validationSchemas/bodyValidationSchemas';

const router = Router();

// Middleware instantiation and concatenation
const bodyParser = new BodyParserMiddleware();
const userAuthorization = new AuthorizationMiddleware([Role.Admin, Role.User]);
const createDatasetValidation = new ValidationMiddleware(schema.createDatasetSchema);
const deleteDatasetValidation = new ValidationMiddleware(schema.deleteDatasetSchema);
const updateDatasetValidation = new ValidationMiddleware(schema.updateDatasetSchema);


bodyParser.setNext(userAuthorization);

//All the routes in this router use BodyParserMiddleware and userAuthorization with the same configuration
router.use((req : Request, res : Response, next : NextFunction) => bodyParser.handle(req, res, next))

//route to retrieve the list of the dataset associated to the user 
router.get('/', controller.getAllDatasets);

//route that consents the creation of a new dataset
router.post('/', (req : Request, res : Response, next : NextFunction) => createDatasetValidation.handle(req, res, next), controller.createDataset);

//route for logical deletion of a dataset given its id
router.delete('/', (req : Request, res : Response, next : NextFunction) => deleteDatasetValidation.handle(req, res, next), controller.deleteDatasetByName);

//route that allows the update of an existings dataset given its id
router.patch('/', (req : Request, res : Response, next : NextFunction) => updateDatasetValidation.handle(req, res, next), controller.updateDatasetByName);

export default router;