import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { Middleware } from "./middleware";

class ValidationMiddleware extends Middleware {
    private schema: Joi.ObjectSchema;

    constructor(schema: Joi.ObjectSchema) {
        super();
        this.schema = schema;
    }

    handle(req: Request, res: Response, next: NextFunction): void {
        const { error } = this.schema.validate(req.body);
        if (error) {
            res.status(400).send(error.details[0].message);
        } else {
            super.handle(req, res, next);
        }
    }
}

export {ValidationMiddleware};
