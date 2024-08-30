import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import * as controller from '../controllers/loginController';
import { BodyParserMiddleware} from '../middlewares/uploadMiddleware';
import { ValidationMiddleware } from '../middlewares/bodyValidationMiddleware';
import { Role } from '../models/request';
import * as schema from '../middlewares/validationSchemas/bodyValidationSchemas';

const router = Router();

// Middleware instantiation and concatenation
const bodyParser = new BodyParserMiddleware();
const loginValidation = new ValidationMiddleware(schema.loginSchema);
const registrationValidation = new ValidationMiddleware(schema.registrationSchema);

router.use((req : Request, res : Response, next : NextFunction) => bodyParser.handle(req, res, next))


//Login route
router.post('/', (req : Request, res : Response, next : NextFunction) => loginValidation.handle(req, res, next), controller.login)

//Registration route
router.post('/registration', (req : Request, res : Response, next : NextFunction) => registrationValidation.handle(req, res, next), controller.registration)

export default router;

