import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import * as controller from '../controllers/inferenceController';
//import { AuthenticationMiddleware, AuthorizationMiddleware, ValidationMiddleware } from '../middleware/middleware';

const router = Router();
 
// Adding middleware to the router
//const authenticationMiddleware = new AuthenticationMiddleware();
//const authorizationMiddleware = new AuthorizationMiddleware(Role.Standard);
//const validationMiddleware = new ValidationMiddleware();
//authenticationMiddleware.setNext(authorizationMiddleware).setNext(validationMiddleware);

// Adding middleware to the router
//router.use((req : Request, res : Response, next : NextFunction) => authenticationMiddleware.handle(req, res, next));

//route to retrieve of the list of the dataset associated to the user 
router.get('/datasets', controller.predictImage);

//route that consents the creation of a new dataset
router.post('/datasets', controller.predictVideo);

//route for logical deletion of a dataset
router.delete('/datasets', controller.predictVideo);

//route that allows the update of an existings dataset
router.patch('/datasets', controller.predictVideo);

//route to insert a new content in a specified dataset
router.post('/contents', controller.predictVideo);

export default router;