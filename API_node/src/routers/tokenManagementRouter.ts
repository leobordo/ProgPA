import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import * as controller from '../controllers/tokenManagementController';
import { AuthenticationMiddleware, AuthorizationMiddleware } from '../middlewares/authMiddleware';
import { BodyParserMiddleware } from '../middlewares/uploadMiddleware';
import { ValidationMiddleware } from '../middlewares/bodyValidationMiddleware';
import { Role } from '../models/request';
import * as schema from '../middlewares/validationSchemas/bodyValidationSchemas';

const router = Router();

// Middleware instantiation and concatenation
const bodyParser = new BodyParserMiddleware();

const userAuthorization = new AuthorizationMiddleware([Role.Admin, Role.User]);

const adminAuthorization = new AuthorizationMiddleware([Role.Admin]);
const updateBalanceValidation = new ValidationMiddleware(schema.tokensTopUpSchema);

adminAuthorization.setNext(updateBalanceValidation);

//All the routes in this router use BodyParserMiddleware
router.use((req : Request, res : Response, next : NextFunction) => bodyParser.handle(req, res, next))

//Routes
//route to retrieve the user's token balance
router.get('/balance', (req: Request, res: Response, next: NextFunction) => userAuthorization.handle(req, res, next), controller.getBalance);

//route that allows the admin to update a user's token balance
router.patch('/balance', (req: Request, res: Response, next: NextFunction) => adminAuthorization.handle(req, res, next), controller.updateBalance);

export default router;