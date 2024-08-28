import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { Middleware } from "./middleware";
import { userSchema } from './validationSchemas/bodyValidationSchemas';

class ValidationMiddleware extends Middleware {
    private bodySchema: Joi.ObjectSchema;
    private userSchema: Joi.ObjectSchema;

    constructor(bodySchema: Joi.ObjectSchema) {
        super();
        this.bodySchema = bodySchema;
        this.userSchema = userSchema;
    }

    handle(req: Request, res: Response, next: NextFunction): void {
        // Validazione di req.body
        const bodyValidationResult = this.bodySchema.validate(req.body);
        if (bodyValidationResult.error) {
            res.status(400).send(bodyValidationResult.error.details[0].message);
            return;
        }

        // Validazione di req.user
        const userValidationResult = this.userSchema.validate(req.user);
        if (userValidationResult.error) {
            res.status(400).send(userValidationResult.error.details[0].message);
            return;
        }

        super.handle(req, res, next);
    }
}

export { ValidationMiddleware };

