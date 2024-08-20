import { Request, Response, NextFunction } from 'express';
import { Middleware } from "./middleware";
const { auth } = require('express-oauth2-jwt-bearer');

//Middleware for authentication that check the correctness of jwt token
class AuthenticationMiddleware extends Middleware {

    private jwtCheck: CallableFunction;

    constructor() {
        super();
        this.jwtCheck = auth({
            audience: process.env.AUDIENCE,
            issuerBaseURL: process.env.ISSUER_BASE_URL,
            algorithms: process.env.SIGNING_ALGORITHM
        });
    }

    handle(req: Request, res: Response, next: NextFunction): void {
        this.jwtCheck(req, res, (err: Error) => {
            if (err) {
                res.status(401).send({ error: 'Invalid token' });
            } else {
                super.handle(req, res, next);
            }
        });
    }
}

export {AuthenticationMiddleware};