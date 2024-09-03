/**
 * @fileOverview This file sets up the routes that consents a user to register and log in. 
 *               It uses various middlewares to parse requests and validate data.
 */
import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';

import * as controller from '../controllers/loginController';
import { BodyParserMiddleware} from '../middlewares/uploadMiddleware';
import { ValidationMiddleware } from '../middlewares/validationMiddleware';
import * as schema from '../middlewares/validationSchemas/requestSchemas';

const router = Router();

// Instantiation of middlewares for body parsing and validation.
const bodyParser = new BodyParserMiddleware();
const loginValidation = new ValidationMiddleware(schema.loginSchema);
const registrationValidation = new ValidationMiddleware(schema.registrationSchema);

/**
 * All routes in this router goes through the BodyParserMiddleware that consent to parse the request body.
 */
router.use((req : Request, res : Response, next : NextFunction) => bodyParser.handle(req, res, next))

//Post route that allows a user to log in and to obtain the jwt token for the authentication
router.post('/', (req : Request, res : Response, next : NextFunction) => loginValidation.handle(req, res, next), controller.login)

//POST route that allows a user to register to the API
router.post('/registration', (req : Request, res : Response, next : NextFunction) => registrationValidation.handle(req, res, next), controller.registration)

export default router;

