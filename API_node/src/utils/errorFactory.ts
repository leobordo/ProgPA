import { StatusCodes } from 'http-status-codes';

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
    InsufficientTokens,
    UserNotFound,
    PswMatch,
    DuplicateUser,
    RequestParsingError,
    DatabaseError,
    FrameCount,
    JobNotCompletedError,
    JobNotFoundError,
    InferenceError
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
        super('ValidationError', message, StatusCodes.BAD_REQUEST);
    }
}

class UserNotFoundError extends ApplicationError {
    constructor(message: string = 'User not found, wrong email or password') {
        super('UserNotFoundError', message, StatusCodes.UNAUTHORIZED);
    }
}

class PswMatchError extends ApplicationError {
    constructor(message: string = "Passwords don't match") {
        super('PswMatchError', message, StatusCodes.UNAUTHORIZED);
    }
}

class DuplicateUserError extends ApplicationError {
    constructor(message: string = 'A user with this email already exists') {
        super('DuplicateUserError', message, StatusCodes.CONFLICT);
    }
}

class AuthenticationError extends ApplicationError {
    constructor(message: string = 'Unauthorized') {
        super('AuthenticationError', message, StatusCodes.UNAUTHORIZED);
    }
}

class AuthorizationError extends ApplicationError {
    constructor(message: string = 'Forbidden') {
        super('AuthorizationError', message, StatusCodes.FORBIDDEN);
    }
}

export class DatabaseError extends ApplicationError {
    constructor(message: string = 'Database error') {
        super('DatabaseError', message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

class GenericError extends ApplicationError {
    constructor(message: string = 'Something went wrong') {
        super('GenericError', message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

class DatasetNotFoundError extends ApplicationError {
    constructor(message: string = 'Dataset not found') {
        super('DatasetNotFoundError', message, StatusCodes.NOT_FOUND);
    }
}

class JobNotFoundError extends ApplicationError {
    constructor(message: string = 'Job not found') {
        super('JobNotFoundError', message, StatusCodes.NOT_FOUND);
    }
}

class InferenceError extends ApplicationError {
    constructor(message: string = 'An error occurred during the inference') {
        super('InferenceError', message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

class DuplicateDatasetError extends ApplicationError {
    constructor(message: string = 'A dataset with this name already exists') {
        super('DuplicateDatasetError', message, StatusCodes.CONFLICT);
    }
}

class FrameCountError extends ApplicationError {
    constructor(message: string = 'Error counting video frames') {
        super('FrameCountError', message, StatusCodes.UNPROCESSABLE_ENTITY);
    }
}

class FileUploadError extends ApplicationError {
    constructor(message: string = 'File upload error') {
        super('FileUploadError', message, StatusCodes.BAD_REQUEST);
    }
}

class DirectoryCreationError extends ApplicationError {
    constructor(message: string = 'Failed to create directory') {
        super('DirectoryCreationError', message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

class MissingParametersError extends ApplicationError {
    constructor(missingParams: string[]) {
        const message = `Missing required parameters: ${missingParams.join(', ')}.`;
        super('MissingParametersError', message, StatusCodes.BAD_REQUEST);
    }
}

class UndefinedRequestError extends ApplicationError {
    constructor(message: string = 'Undefined request, try again') {
        super('UndefinedRequestError', message, StatusCodes.NOT_IMPLEMENTED);
    }
}

export class InsufficientTokensError extends ApplicationError {
    constructor(message: string = 'Insufficient tokens to complete request') {
        super('InsufficientTokensError', message, StatusCodes.PAYMENT_REQUIRED);
    }
}

class RequestParsingError extends ApplicationError {
    constructor(message: string = 'An error occurred while parsing the request') {
        super('RequestParsingError', message, StatusCodes.BAD_REQUEST);
    }
}

class JobNotCompletedError extends ApplicationError {
    constructor(message: string = 'the job has not been completed yet') {
        super('RequestParsingError', message, StatusCodes.BAD_REQUEST);
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
            case ErrorType.UserNotFound:
                return new UserNotFoundError(message);
            case ErrorType.DuplicateUser:
                return new DuplicateUserError(message);
            case ErrorType.PswMatch:
                return new PswMatchError(message);
            case ErrorType.RequestParsingError:
                return new RequestParsingError(message);
            case ErrorType.DatabaseError:
                return new DatabaseError(message);
            case ErrorType.FrameCount:
                return new FrameCountError(message);
            case ErrorType.JobNotCompletedError:
                return new JobNotCompletedError(message);
            case ErrorType.JobNotFoundError:
                return new JobNotFoundError(message);
            case ErrorType.InferenceError:
                return new InferenceError(message);
            default:
                return new GenericError(message);
        }
    }
}

export { ErrorType, ErrorFactory, IAppError, ApplicationError };
