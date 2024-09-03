/**
 * @fileOverview This file sets up the routes for token related operations.
 *               It uses various middlewares to parse requests, validate data, and authorize users.
 */
import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import * as controller from '../controllers/tokenManagementController';
import { AuthorizationMiddleware } from '../middlewares/authMiddleware';
import { BodyParserMiddleware } from '../middlewares/uploadMiddleware';
import { ValidationMiddleware } from '../middlewares/validationMiddleware';
import { Role } from '../models/request';
import * as schema from '../middlewares/validationSchemas/requestSchemas';

const router = Router();

// Instantiation of middlewares for body parsing, authorization and validation.
const bodyParser = new BodyParserMiddleware();
const userAuthorization = new AuthorizationMiddleware([Role.Admin, Role.User]);
const adminAuthorization = new AuthorizationMiddleware([Role.Admin]);
const updateBalanceValidation = new ValidationMiddleware(schema.tokensTopUpSchema);

adminAuthorization.setNext(updateBalanceValidation);

/**
 * Setting the BodyParserMiddleware as default middlewares for all routes in this router.
 */
router.use((req : Request, res : Response, next : NextFunction) => bodyParser.handle(req, res, next))

//GET route to retrieve the user's token balance
router.get('/', (req: Request, res: Response, next: NextFunction) => userAuthorization.handle(req, res, next), controller.getBalance);

//PATCH route that allows the admin to update a user's token balance
router.patch('/', (req: Request, res: Response, next: NextFunction) => adminAuthorization.handle(req, res, next), controller.updateBalance);

export default router;