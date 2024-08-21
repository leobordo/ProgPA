import { Request, Response, NextFunction } from 'express';
import { Middleware } from "./middleware";
import { Role, AuthenticatedRequest } from '../models/request';
const { auth } = require('express-oauth2-jwt-bearer');

//Middleware for authentication that check the correctness of jwt token
class AuthenticationMiddleware extends Middleware {

    private jwtCheck: CallableFunction;

    constructor() {
        super();
        this.jwtCheck = auth({
            audience: process.env.AUDIENCE,
            issuerBaseURL: process.env.ISSUER_BASE_URL,
            algorithms: [process.env.SIGNING_ALGORITHM],                        //Signign algorithm
            jwksUri: `https://${process.env.TENANT_NAME}/.well-known/jwks.json` //Public key recovery
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

//Middleware for authorization that check the role of the user
class AuthorizationMiddleware extends Middleware {

    private requiredRoles: Array<Role>;

    constructor(requiredRoles: Array<Role>) {
        super();
        this.requiredRoles = requiredRoles;
    }

    //Checks if the role specified in the token is among those required to access the route
    handle(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
        if (this.requiredRoles.includes(req.auth.payload.role as Role)) {
            super.handle(req, res, next);
        } else {
            res.status(401).send({ error: 'Unauthorized' });
        }
    }
}

export {AuthenticationMiddleware, AuthorizationMiddleware};