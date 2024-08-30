/**
 * @fileOverview This file contains the parent Middleware class, that is exitended by other 
 *               Middleware classes to implement the Chain of Responsibility pattern.  
 */
import { Request, Response, NextFunction } from 'express';

/**
 * Base class for creating middleware that can be linked in a chain. 
 * This implementation follows the Chain of Responsibility pattern, allowing each middleware to pass the request 
 * to the next in the chain, or to terminate the chain if there are no more middleware.
 */
class Middleware {

    private next: Middleware | null = null;

    /** 
     * Sets the next middleware and returns the reference to the next middleware (to concatenate setNext methods).
     * This method is useful to create a middleware chain, as proposed by the chain of responsibility pattern.
     * @param {Middleware} middleware - A reference to the middleware to be set next in the chain
     * @returns {Middleware} - A reference to the middleware set as next in the chain                     
     */
    setNext(middleware: Middleware): Middleware {
        this.next = middleware;
        return middleware;
    }

    /**
     * Handles the request by passing it to the next middleware in the chain, if any. 
     * If there are no other middleware in the chain, calls Express's `next()` method to proceed to the next handler 
     * @param {Request} req - The Express request object, that represent the HTTP request.
     * @param {Response} res - The Express response object used for sending back the HTTP response.
     * @param {NextFunction} next - The Express callback function to call to pass control to the next handler.
     */
    handle(req: Request, res: Response, next: NextFunction): void {
        if (this.next != null) {
            return this.next.handle(req, res, next);
        }
        next();
    }
}

export { Middleware };