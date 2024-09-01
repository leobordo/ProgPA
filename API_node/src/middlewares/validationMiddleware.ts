/**
 * @fileOverview This file contains the definition of theValidationMiddleware class that is used 
 *               for validating the request body and the user data originally contained
 *               in the jwt token and attached to the response object by the authentication middleware.
 */
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

import { Middleware } from "./middleware";
import { userSchema } from './validationSchemas/validationSchemas';
import { ErrorFactory, ErrorType } from '../utils/errorFactory';

/**
 * Middleware class for validating both the request body and the user data embedded within the request.
 * Utilizes Joi schemas to ensure that both sets of data adhere to defined constraints before allowing
 * processing to continue to subsequent middleware or controller.
 */
class ValidationMiddleware extends Middleware {
    private bodySchema: Joi.ObjectSchema;   // Schema for request body validation
    private userSchema: Joi.ObjectSchema;   // Schema for user data validation (req.user)

    /**
     * Constructs a new instance of ValidationMiddleware with a Joi schema for the body.
     * The user schema is imported and used for validating user data within the request.
     * 
     * @param {Joi.ObjectSchema} bodySchema - A Joi schema object to validate the request body.
     */
    constructor(bodySchema: Joi.ObjectSchema) {
        super();
        this.bodySchema = bodySchema;
        this.userSchema = userSchema;
    }

    /**
     * Middleware handle function to perform validation on the request body and the user data.
     * If validation fails for either, a Bad Request response is sent with the error message.
     * If both validations pass, control is handed to the next middleware/controller in the chain.
     * 
     * @param {Request} req - The request object from Express, containing the body and user data to validate.
     * @param {Response} res - The response object from Express used to send back error messages if needed.
     * @param {NextFunction} next - The callback function to pass control to the next middleware/controller.
     */
    handle(req: Request, res: Response, next: NextFunction): void {
        try {
            // Validates the request body against the bodySchema
            const bodyValidationResult = this.bodySchema.validate(req.body);
            if (bodyValidationResult.error) {
                next(ErrorFactory.createError(ErrorType.Validation, bodyValidationResult.error.details[0].message));
                return;
            }

            // Validates the user data against the userSchema
            const userValidationResult = this.userSchema.validate(req.user);
            if (userValidationResult.error) {
                next(ErrorFactory.createError(ErrorType.Validation, userValidationResult.error.details[0].message));
                return;
            }

            // If all validations pass, proceeds to the next middleware/controller
            super.handle(req, res, next);

        } catch (err) {
            next(err);
        }
    }
}

export { ValidationMiddleware };

