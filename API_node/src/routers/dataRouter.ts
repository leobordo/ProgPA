import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import * as controller from '../controllers/dataController';
import uploadCustom from '../middlewares/multerConfig';
//import { AuthenticationMiddleware, AuthorizationMiddleware, ValidationMiddleware } from '../middleware/middleware';

const router = Router();
const multer  = require('multer')
const upload = multer()
// Adding middleware to the router
//const authenticationMiddleware = new AuthenticationMiddleware();
//const authorizationMiddleware = new AuthorizationMiddleware(Role.Standard);
//const validationMiddleware = new ValidationMiddleware();
//authenticationMiddleware.setNext(authorizationMiddleware).setNext(validationMiddleware);

// Adding middleware to the router
//router.use((req : Request, res : Response, next : NextFunction) => authenticationMiddleware.handle(req, res, next));

//route to retrieve of the list of the dataset associated to the user 
router.get('/', controller.getAllDatasets);

//route that consents the creation of a new dataset
router.post('/', upload.none(), controller.createDataset);

//route for logical deletion of a dataset given its id
router.delete('/:id',upload.none(), controller.deleteDatasetByName);

//route that allows the update of an existings dataset given its id
router.patch('/:id',upload.none(), controller.updateDatasetByName);

//route to insert a new content in a specified dataset (through the dataset id)
router.post('/:id/contents', uploadCustom.single('file'), controller.insertContents);

export default router;