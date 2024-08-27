import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { Middleware } from "./middleware";

class ValidationMiddleware extends Middleware {
    private schemas: Joi.ObjectSchema[];

    constructor(schemas: Joi.ObjectSchema[]) {
        super();
        this.schemas = schemas;
    }

    handle(req: Request, res: Response, next: NextFunction): void {
        for (const schema of this.schemas) {
            const { error } = schema.validate(req.body);
            if (error) {
                res.status(400).send(error.details[0].message);
                return;
            }
        }

        // Se nessun errore viene trovato in nessuno degli schemi, passa al prossimo middleware
        super.handle(req, res, next);
    }
}

export { ValidationMiddleware };

