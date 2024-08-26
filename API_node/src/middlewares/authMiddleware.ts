import { Request, Response, NextFunction } from 'express';
import { Middleware } from "./middleware";
import { Role, UserPayload } from '../models/request';
import * as jwt from 'jsonwebtoken';


// Estendi l'interfaccia Request di Express
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      userEmail: string;
      userRole: Role;
    };
  }
}

const fs = require('fs');
//const { auth } = require('express-oauth2-jwt-bearer');

const publicKey = fs.readFileSync('././public_key.pem', 'utf8');    //Public key recovery

/*
//Middleware for authentication that check the correctness of jwt token
class AuthenticationMiddleware extends Middleware {

    private jwtCheck: CallableFunction;

    constructor() {
        super();
        console.log(process.env.AUDIENCE)
        console.log(process.env.ISSUER_BASE_URL)
        console.log(process.env.SIGNING_ALGORITHM)
        console.log(process.env.PUBLIC_KEY)

        this.jwtCheck = auth({
            audience: process.env.AUDIENCE,
            issuerBaseURL: process.env.ISSUER_BASE_URL,
            tokenSigningAlg: process.env.SIGNING_ALGORITHM,             //Signign algorithm
            secret: process.env.PUBLIC_KEY 
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
}*/
//const publicKey = process.env.PUBLIC_KEY!.replace(/\\n/g, '\n');

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

            // Checks the token
            jwt.verify(token, publicKey, { algorithms: ['RS256'] }, (err: any, decoded: any) => {
                console.log(token)
                if (err) {
                    return res.status(403).send({ error: 'Token is invalid' });
                }

                // Cast the decoded object
                const decodedPayload = decoded as UserPayload;
                
                // Arricchisce la richiesta con i dati dell'utente contenuti nel token
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
        if (this.requiredRoles.includes(req.body.userRole as Role)) {
            super.handle(req, res, next);
        } else {
            res.status(401).send({ error: 'Unauthorized' });
        }
    }
}

export {AuthenticationMiddleware, AuthorizationMiddleware};