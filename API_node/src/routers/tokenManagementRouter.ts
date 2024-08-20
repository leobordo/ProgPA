import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import * as controller from '../controllers/tokenManagementController';
//import { AuthenticationMiddleware, AuthorizationMiddleware, ValidationMiddleware } from '../middleware/middleware';

const router = Router();
 
// Adding middleware to the router
//const authenticationMiddleware = new AuthenticationMiddleware();
//const authorizationMiddleware = new AuthorizationMiddleware(Role.Standard);
//const validationMiddleware = new ValidationMiddleware();
//authenticationMiddleware.setNext(authorizationMiddleware).setNext(validationMiddleware);

// Adding middleware to the router
//router.use((req : Request, res : Response, next : NextFunction) => authenticationMiddleware.handle(req, res, next));

//route to retrieve the user's token balance
router.get('/balance', controller.getBalance);

//route that allows the admin to update a user's token balance
router.patch('/balance', controller.updateBalance);

export default router;