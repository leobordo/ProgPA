import { Request, Response, NextFunction } from 'express';
import { Middleware } from "./middleware";
import { Role, UserPayload } from '../models/request';
import * as jwt from 'jsonwebtoken';
const fs = require('fs');

const publicKey = fs.readFileSync('././public_key.pem', 'utf8');    //Public key recovery

class AuthenticationMiddleware extends Middleware {

    constructor() {
        super();
    }

    handle(req: Request, res: Response, next: NextFunction): void {
        const authHeader = req.headers.authorization;

        if (authHeader) {
            const token = authHeader.split(' ')[1];     //Token extraction ( Authorization: Bearer <token> )
            if (!token) {
                res.status(401).send({ error: 'Token not found' });
            }

            // Checks the token and puts the user's information into the request if it's valid 
            jwt.verify(token, publicKey, { algorithms: ['RS256'] }, (err: any, decoded: any) => {
                if (err) {
                    return res.status(403).send({ error: 'Token is invalid' });
                }
                // Casts the decoded object
                const decodedPayload = decoded as UserPayload;
                req.user = {
                    userEmail: decodedPayload.email,
                    userRole: decodedPayload.role as Role
                };
                super.handle(req, res, next);
            });
        } else {

            res.status(401).send({ error: 'Authorization header is missing' });
        }
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
    handle(req: Request, res: Response, next: NextFunction): void {
        if (this.requiredRoles.includes(req.user!.userRole as Role)) {
            super.handle(req, res, next);
        } else {
            res.status(401).send({ error: 'Unauthorized' });
        }
    }
}

export {AuthenticationMiddleware, AuthorizationMiddleware};