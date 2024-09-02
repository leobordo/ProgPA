/**
 * @fileOverview This file contains the definition of the AuthenticationMiddleware and 
 *               AuthorizationMiddleware classes. The first is used to verify the jwt token
 *               and the latter to check if the user role is among hose required to access the route.
 */
import { Request, Response, NextFunction } from 'express';
import { Middleware } from "./middleware";
import { Role, UserPayload } from '../models/request';
import * as jwt from 'jsonwebtoken';
import { ErrorFactory, ErrorType } from '../utils/errorFactory';

/**
 * Middleware for handling JWT authentication.
 * This class extends the Middleware base class and is responsible for extracting the JWT from
 * the authorization header, verifying it, and attaching the user's payload to the request object.
 */
class AuthenticationMiddleware extends Middleware {

    constructor() {
        super();
    }

    /**
     * Processes an incoming HTTP request to authenticate the user based on a JWT.
     * If the token is valid, it decodes the user's details, attach them to the request object and proceeds to the next middleware.
     * If the token is invalid or missing, it pass the an unathorized error to the next middleware;
     * the exception must be handled by the ErrorHandlingMiddleware.
     * 
     * @param req - Express's HTTP request object.
     * @param res - Express's HTTP response object.
     * @param next - Callback to the next middleware function.
     */
    handle(req: Request, res: Response, next: NextFunction): void {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                throw ErrorFactory.createError(ErrorType.Authentication, 'Authorization header is missing');
            }

            const token = authHeader.split(' ')[1]; // Extract token (Bearer <token>)
            if (!token) {
                throw ErrorFactory.createError(ErrorType.Authentication, 'Token not found');
            }

            // Verifies the token using the RSA public key; if it's valid, attach user's information to the request object
            jwt.verify(token, (process.env.PUBLIC_KEY)!.replace(/\\n/g, '\n'), { 
                algorithms: ['RS256'],
                audience: process.env.TOKEN_AUD,
                issuer: process.env.TOKEN_DURATION 
            }, (err, decoded) => {
                if (err) {
                    throw ErrorFactory.createError(ErrorType.Authentication, 'Token is invalid');
                }
                
                const decodedPayload = decoded as UserPayload;
                req.user = {
                    userEmail: decodedPayload.email,
                    userRole: decodedPayload.role as Role
                };
                super.handle(req, res, next); // Continue to the next middleware if authentication is successful
            });
        } catch (error) {
            // Pass any unexpected error to the next middleware
            next(error);
        }
    }
}

/**
 * It extends the Middleware base class and ensures that the user has the required role to access the route.
 */
class AuthorizationMiddleware extends Middleware {

    private requiredRoles: Array<Role>; // List of roles authorized to access the route

    /**
     * Constructs a new instance of AuthorizationMiddleware
     * @param requiredRoles - List of roles authorized to access the route.
     */
    constructor(requiredRoles: Array<Role>) {
        super();
        this.requiredRoles = requiredRoles;
    }

    /**
     * Checks if the user's role specified in the JWT is among those required to access the route.
     * Proceeds to the next middleware if authorized, or sends an forbidden response otherwise.
     * 
     * @param req - Express's HTTP request object.
     * @param res - Express's HTTP response object.
     * @param next - Callback to the next middleware function.
     */
    handle(req: Request, res: Response, next: NextFunction): void {
        if (this.requiredRoles.includes(req.user!.userRole as Role)) {
            super.handle(req, res, next);
        } else {
            next(ErrorFactory.createError(ErrorType.Authorization, 'Forbidden'));
        }
    }
}

export {AuthenticationMiddleware, AuthorizationMiddleware};