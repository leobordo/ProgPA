import { Request, Response, NextFunction } from 'express';

// Parent Middleware class
class Middleware {

    private next: Middleware | null = null;

    // setNext sets the next middleware and returns the reference to the next middleware 
    // (to concatenate setNext methods)
    setNext(middleware: Middleware): Middleware {
        this.next = middleware;
        return middleware;
    }

    // if there is a subsequent middleware it call its handle function and return its result, 
    // otherwise pass the control
    handle(req: Request, res: Response, next: NextFunction): void {
        if (this.next != null) {
            return this.next.handle(req, res, next);
        }
        next();
    }
}

export { Middleware };