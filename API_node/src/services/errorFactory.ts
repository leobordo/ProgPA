// Link per codici di errore: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status

enum ErrorType {
    Authentication,
    Authorization,
    Validation,
    Generic
}

interface IAppError {
    name: string;
    message: string;
    status: number;
    stack?: string;
}

class ApplicationError extends Error implements IAppError {
    public status: number;

    constructor(name: string, message: string, status: number) {
        super(message);
        this.name = name;
        this.status = status;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends ApplicationError {
    constructor(message: string = 'Validation error occurred') {
        super('ValidationError', message, 400);
    }
}

class AuthenticationError extends ApplicationError {
    constructor(message: string = 'Unauthorized') {
        super('AuthenticationError', message, 401);
    }
}

class AuthorizationError extends ApplicationError {
    constructor(message: string = 'Forbidden') {
        super('AuthorizationError', message, 403);
    }
}

class GenericError extends ApplicationError {
    constructor(message: string = 'Something went wrong') {
        super('GenericError', message, 500);
    }
}

class ErrorFactory {
    static createError(type: ErrorType, message?: string): IAppError {
        switch (type) {
            case ErrorType.Authentication:
                return new AuthenticationError(message);
            case ErrorType.Validation:
                return new ValidationError(message);
            case ErrorType.Authorization:
                return new AuthorizationError(message);
            default:
                return new GenericError(message);
        }
    }
}

export {ErrorType, ErrorFactory, IAppError}