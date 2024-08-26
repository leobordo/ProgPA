import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import * as controller from '../controllers/inferenceController';
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

//route to make inference on a dataset 
router.post('/',upload.none(), controller.makeInference);

//route to check the state of a job
router.get('/:process_id/state',upload.none(), controller.checkState);

//route to retrieve the result of an inference
router.get('/:process_id/result',upload.none(), controller.getResult);

export default router;