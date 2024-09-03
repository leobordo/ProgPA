/**
 * @fileOverview This file contains the definition of the ErrorHandlingMiddleware class that is used
 *               for handling errors in the middleware chain. It extends
 *               the base Middleware class and provides a specialized method for error handling.
 */
import { Request, Response, NextFunction } from 'express';
import { Middleware } from './middleware';
import { IAppError } from '../utils/errorFactory';

/**
 * @class Specialized middleware class for handling errors in the middleware chain.
 * This class extends the base Middleware class and overrides its handle method to include
 * error handling functionality. It captures errors passed through the middleware chain
 * and responds with a standardized error response.
 */
class ErrorHandlingMiddleware extends Middleware {

    /**
     * Handles errors by responding with the appropriate status and message. 
     * If there is no error, it simply passes control to the next middleware.
     * @param {IAppError} err - The error object, if any.
     * @param {Request} req - The Express request object, representing the HTTP request.
     * @param {Response} res - The Express response object used for sending back the HTTP response.
     * @param {NextFunction} next - The Express callback function to call to pass control to the next handler.
     */
    handleError(err: IAppError | undefined, req: Request, res: Response, next: NextFunction): void {
        if (err) {
            console.error(err);
            const errorResponse = {
                name: err.name || 'InternalServerError',
                message: err.message || 'An unexpected error occurred.',
                status: err.status || 500,
                ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
            };

            // Send the error response
            res.status(errorResponse.status).json(errorResponse);
        } else {
            next(); // If no error, pass to the next middleware
        }
    }

    /**
     * Overrides the handle method to route errors to the error handler.
     * @param {Request} req - The Express request object, representing the HTTP request.
     * @param {Response} res - The Express response object used for sending back the HTTP response.
     * @param {NextFunction} next - The Express callback function to call to pass control to the next handler.
     * @param {IAppError} [err] - Optional error object if an error has occurred.
     */
    handle(req: Request, res: Response, next: NextFunction, err?: IAppError): void {
        if (err) {
            this.handleError(err, req, res, next);
        } else {
            super.handle(req, res, next); // Call the base class's handle method
        }
    }
}

export { ErrorHandlingMiddleware };
