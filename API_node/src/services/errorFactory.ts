// Link per codici di errore: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status

enum ErrorType {
    Authentication,
    Authorization,
    Validation,
    Generic,
    DatasetNotFound,
    DuplicateDataset,
    MissingParameters,
    FileUpload,
    UndefinedRequest,
    DirectoryCreation,
    InsufficientTokens
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

class DatasetNotFoundError extends ApplicationError {
    constructor(message: string = 'Dataset not found') {
        super('DatasetNotFoundError', message, 404);
    }
}

class DuplicateDatasetError extends ApplicationError {
    constructor(message: string = 'A dataset with this name already exists') {
        super('DuplicateDatasetError', message, 409);
    }
}

class FileUploadError extends ApplicationError {
    constructor(message: string = 'File upload error') {
        super('FileUploadError', message, 400);
    }
}

class DirectoryCreationError extends ApplicationError {
    constructor(message: string = 'Failed to create directory') {
        super('DirectoryCreationError', message, 500);
    }
}
class MissingParametersError extends ApplicationError {
    constructor(missingParams: string[]) {
        const message = `Missing required parameters: ${missingParams.join(', ')}.`;
        super('MissingParametersError', message, 400);
    }
}
class UndefinedRequestError extends ApplicationError {
    constructor(message: string = 'Undefined request, try again') {
        super('UndefinedRequestError', message, 501);
    }
}
class InsufficientTokensError extends ApplicationError {
    constructor(message: string = 'Insufficient tokens to complete request') {
        super('InsufficientTokens', message, 402);
    }
}

class ErrorFactory {
    static createError(type: ErrorType, message?: string, options?: any): IAppError {
        switch (type) {
            case ErrorType.Authentication:
                return new AuthenticationError(message);
            case ErrorType.Validation:
                return new ValidationError(message);
            case ErrorType.Authorization:
                return new AuthorizationError(message);
            case ErrorType.MissingParameters:
                return new MissingParametersError(options);
            case ErrorType.UndefinedRequest:
                return new UndefinedRequestError(message);
            case ErrorType.DatasetNotFound:
                return new DatasetNotFoundError(message);
            case ErrorType.InsufficientTokens:
                return new InsufficientTokensError(message);
            case ErrorType.DuplicateDataset:
                return new DuplicateDatasetError(message);
            case ErrorType.FileUpload:
                return new FileUploadError(message);
            case ErrorType.DirectoryCreation:
                return new DirectoryCreationError(message);
            default:
                return new GenericError(message);
        }
    }
}

export { ErrorType, ErrorFactory, IAppError };
