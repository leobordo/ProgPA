/**
 * @fileOverview This file sets up the routes for CRUD operations on datasets. This includes creating, retrieving,
 *               updating, and deleting datasets associated with a user.
 */
import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';

import * as controller from '../controllers/dataController';
import { AuthorizationMiddleware } from '../middlewares/authMiddleware';
import { BodyParserMiddleware } from '../middlewares/uploadMiddleware';
import { ValidationMiddleware } from '../middlewares/validationMiddleware';
import { Role } from '../models/request';
import * as schema from '../middlewares/validationSchemas/validationSchemas';

const router = Router();

// Instantiation of middlewares for body parsing, authorization and validation.
const bodyParser = new BodyParserMiddleware();
const userAuthorization = new AuthorizationMiddleware([Role.Admin, Role.User]);
const createDatasetValidation = new ValidationMiddleware(schema.createDatasetSchema);
const deleteDatasetValidation = new ValidationMiddleware(schema.deleteDatasetSchema);
const updateDatasetValidation = new ValidationMiddleware(schema.updateDatasetSchema);

bodyParser.setNext(userAuthorization);

/**
 * All the routes in this router use BodyParserMiddleware and userAuthorization with the same configuration
*/
router.use((req : Request, res : Response, next : NextFunction) => bodyParser.handle(req, res, next))

//GET route that retrieves the list of the dataset associated to the user 
router.get('/', controller.getAllDatasets);

//POST route that consents the creation of a new dataset
router.post('/', (req : Request, res : Response, next : NextFunction) => createDatasetValidation.handle(req, res, next), controller.createDataset);

//DELETE route for logical deletion of a dataset (associated to the user) given the dataset name
router.delete('/', (req : Request, res : Response, next : NextFunction) => deleteDatasetValidation.handle(req, res, next), controller.deleteDatasetByName);

//PATCH route that allows the update of an existings dataset (associated to the user) given the dataset name
router.patch('/', (req : Request, res : Response, next : NextFunction) => updateDatasetValidation.handle(req, res, next), controller.updateDatasetByName);

export default router;