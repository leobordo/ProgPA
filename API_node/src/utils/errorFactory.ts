/**
 * @fileOverview Error Handling Module
 * 
 * This module defines a set of custom error classes for the application, each extending the base `ApplicationError` class.
 * These classes represent various types of errors that can occur during the execution of the program, such as 
 * authentication errors, authorization errors, validation errors, and more. It also includes an enumeration `ErrorType` 
 * to identify different types of errors and an `ErrorFactory` to create instances of these errors based on the type.
 */

import { StatusCodes } from 'http-status-codes';

// Enumeration that defines error types for the application.
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
    InferenceError,
    UnzipError,
    DirectoryRmError
}

/**
 * Interface for application errors.
 *
 * @interface IAppError
 */
interface IAppError {
    name: string;
    message: string;
    status: number;
    stack?: string;
}

/**
 * Base class for all custom application errors.
 * 
 * @class ApplicationError
 * @extends {Error}
 * @implements {IAppError}
 */
class ApplicationError extends Error implements IAppError {
    public status: number;

    /**
     * Creates an instance of ApplicationError.
     * 
     * @param {string} name - The name of the error.
     * @param {string} message - The error message.
     * @param {number} status - The HTTP status code.
     */
    constructor(name: string, message: string, status: number) {
        super(message);
        this.name = name;
        this.status = status;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Class for validation errors.
 * 
 * @class ValidationError
 * @extends {ApplicationError}
 */
class ValidationError extends ApplicationError {
    
    /**
     * Creates an instance of ValidationError.
     * 
     * @param {string} [message='Validation error occurred'] - The error message.
     */
    constructor(message: string = 'Validation error occurred') {
        super('ValidationError', message, StatusCodes.BAD_REQUEST);
    }
}

/**
 * Class for user not found errors.
 * 
 * @class UserNotFoundError
 * @extends {ApplicationError}
 */
class UserNotFoundError extends ApplicationError {
    
    /**
     * Creates an instance of UserNotFoundError.
     * 
     * @param {string} [message='User not found, wrong email or password'] - The error message.
     */
    constructor(message: string = 'User not found, wrong email or password') {
        super('UserNotFoundError', message, StatusCodes.UNAUTHORIZED);
    }
}

/**
 * Class for password mismatch errors.
 * 
 * @class PswMatchError
 * @extends {ApplicationError}
 */
class PswMatchError extends ApplicationError {
    /**
     * Creates an instance of PswMatchError.
     * 
     * @param {string} [message="Passwords don't match"] - The error message.
     */
    constructor(message: string = "Passwords don't match") {
        super('PswMatchError', message, StatusCodes.UNAUTHORIZED);
    }
}

/**
 * Class for duplicate user errors.
 * 
 * @class DuplicateUserError
 * @extends {ApplicationError}
 */
class DuplicateUserError extends ApplicationError {
    /**
     * Creates an instance of DuplicateUserError.
     * 
     * @param {string} [message='A user with this email already exists'] - The error message.
     */
    constructor(message: string = 'A user with this email already exists') {
        super('DuplicateUserError', message, StatusCodes.CONFLICT);
    }
}

/**
 * Class for authentication errors.
 * 
 * @class AuthenticationError
 * @extends {ApplicationError}
 */
class AuthenticationError extends ApplicationError {
    
    /**
     * Creates an instance of AuthenticationError.
     * 
     * @param {string} [message='Unauthorized'] - The error message.
     */
    constructor(message: string = 'Unauthorized') {
        super('AuthenticationError', message, StatusCodes.UNAUTHORIZED);
    }
}

/**
 * Class for authorization errors.
 * 
 * @class AuthorizationError
 * @extends {ApplicationError}
 */
class AuthorizationError extends ApplicationError {
    
    /**
     * Creates an instance of AuthorizationError.
     * 
     * @param {string} [message='Forbidden'] - The error message.
     */
    constructor(message: string = 'Forbidden') {
        super('AuthorizationError', message, StatusCodes.FORBIDDEN);
    }
}

/**
 * Class for database errors.
 * 
 * @class DatabaseError
 * @extends {ApplicationError}
 */
export class DatabaseError extends ApplicationError {

    /**
     * Creates an instance of DatabaseError.
     * 
     * @param {string} [message='Database error'] - The error message.
     */
    constructor(message: string = 'Database error') {
        super('DatabaseError', message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

/**
 * Class for generic errors.
 * 
 * @class GenericError
 * @extends {ApplicationError}
 */
class GenericError extends ApplicationError {
    
    /**
     * Creates an instance of GenericError.
     * 
     * @param {string} [message='Something went wrong'] - The error message.
     */
    constructor(message: string = 'Something went wrong') {
        super('GenericError', message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

/**
 * Class for unzip errors.
 * 
 * @class UnzipError
 * @extends {ApplicationError}
 */
class UnzipError extends ApplicationError {
    
    /**
     * Creates an instance of UnzipError.
     * 
     * @param {string} [message='Something went wrong while unzipping'] - The error message.
     */
    constructor(message: string = 'Something went wrong while unzipping') {
        super('UnzipError', message, StatusCodes.UNPROCESSABLE_ENTITY);
    }
}

/**
 * Class for directory removal errors.
 * 
 * @class DirectoryRmError
 * @extends {ApplicationError}
 */
class DirectoryRmError extends ApplicationError {
    
    /**
     * Creates an instance of DirectoryRmError.
     * 
     * @param {string} [message='Something went wrong while removing a directory'] - The error message.
     */
    constructor(message: string = 'Something went wrong while removing a directory') {
        super('DirectoryRmError', message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

/**
 * Class for dataset not found errors.
 * 
 * @class DatasetNotFoundError
 * @extends {ApplicationError}
 */
class DatasetNotFoundError extends ApplicationError {
    
    /**
     * Creates an instance of DatasetNotFoundError.
     * 
     * @param {string} [message='Dataset not found'] - The error message.
     */
    constructor(message: string = 'Dataset not found') {
        super('DatasetNotFoundError', message, StatusCodes.NOT_FOUND);
    }
}

/**
 * Class for job not found errors.
 * 
 * @class JobNotFoundError
 * @extends {ApplicationError}
 */
class JobNotFoundError extends ApplicationError {
    
    /**
     * Creates an instance of JobNotFoundError.
     * 
     * @param {string} [message='Job not found'] - The error message.
     */
    constructor(message: string = 'Job not found') {
        super('JobNotFoundError', message, StatusCodes.NOT_FOUND);
    }
}

/**
 * Class for inference errors.
 * 
 * @class InferenceError
 * @extends {ApplicationError}
 */
class InferenceError extends ApplicationError {
    
    /**
     * Creates an instance of InferenceError.
     * 
     * @param {string} [message='An error occurred during the inference'] - The error message.
     */
    constructor(message: string = 'An error occurred during the inference') {
        super('InferenceError', message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

/**
 * Class for duplicate dataset errors.
 * 
 * @class DuplicateDatasetError
 * @extends {ApplicationError}
 */
class DuplicateDatasetError extends ApplicationError {
    
    /**
     * Creates an instance of DuplicateDatasetError.
     * 
     * @param {string} [message='A dataset with this name already exists'] - The error message.
     */
    constructor(message: string = 'A dataset with this name already exists') {
        super('DuplicateDatasetError', message, StatusCodes.CONFLICT);
    }
}

/**
 * Class for frame count errors.
 * 
 * @class FrameCountError
 * @extends {ApplicationError}
 */
class FrameCountError extends ApplicationError {
    
    /**
     * Creates an instance of FrameCountError.
     * 
     * @param {string} [message='Error counting video frames'] - The error message.
     */
    constructor(message: string = 'Error counting video frames') {
        super('FrameCountError', message, StatusCodes.UNPROCESSABLE_ENTITY);
    }
}

/**
 * Class for file upload errors.
 * 
 * @class FileUploadError
 * @extends {ApplicationError}
 */
class FileUploadError extends ApplicationError {
    
    /**
     * Creates an instance of FileUploadError.
     * 
     * @param {string} [message='File upload error'] - The error message.
     */
    constructor(message: string = 'File upload error') {
        super('FileUploadError', message, StatusCodes.BAD_REQUEST);
    }
}

/**
 * Class for directory creation errors.
 * 
 * @class DirectoryCreationError
 * @extends {ApplicationError}
 */
class DirectoryCreationError extends ApplicationError {
    
     /**
     * Creates an instance of DirectoryCreationError.
     * 
     * @param {string} [message='Failed to create directory'] - The error message.
     */
    constructor(message: string = 'Failed to create directory') {
        super('DirectoryCreationError', message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

/**
 * Class representing an error for missing parameters.
 *
 * @class MissingParametersError
 * @extends {ApplicationError}
 */
class MissingParametersError extends ApplicationError {
    
    /**
     * Creates an instance of MissingParametersError.
     *
     * @param {string[]} missingParams - An array of missing parameter names.
     */
    constructor(missingParams: string[]) {
        const message = `Missing required parameters: ${missingParams.join(', ')}.`;
        super('MissingParametersError', message, StatusCodes.BAD_REQUEST);
    }
}

/**
 * Class representing an error for an undefined request.
 *
 * @class UndefinedRequestError
 * @extends {ApplicationError}
 */
class UndefinedRequestError extends ApplicationError {
    
    /**
     * Creates an instance of UndefinedRequestError.
     *
     * @param {string} [message='Undefined request, try again'] - The error message.
     */
    constructor(message: string = 'Undefined request, try again') {
        super('UndefinedRequestError', message, StatusCodes.NOT_IMPLEMENTED);
    }
}

/**
 * Class representing an error for insufficient tokens.
 *
 * @class InsufficientTokensError
 * @extends {ApplicationError}
 */
export class InsufficientTokensError extends ApplicationError {
    
    /**
     * Creates an instance of InsufficientTokensError.
     *
     * @param {string} [message='Insufficient tokens to complete request'] - The error message.
     */
    constructor(message: string = 'Insufficient tokens to complete request') {
        super('InsufficientTokensError', message, StatusCodes.PAYMENT_REQUIRED);
    }
}

/**
 * Class representing an error that occurs during request parsing.
 *
 * @class RequestParsingError
 * @extends {ApplicationError}
 */
class RequestParsingError extends ApplicationError {
    
    /**
     * Creates an instance of RequestParsingError.
     *
     * @param {string} [message='An error occurred while parsing the request'] - The error message.
     */
    constructor(message: string = 'An error occurred while parsing the request') {
        super('RequestParsingError', message, StatusCodes.BAD_REQUEST);
    }
}

/**
 * Class representing an error for a job that has not been completed yet.
 *
 * @class JobNotCompletedError
 * @extends {ApplicationError}
 */
class JobNotCompletedError extends ApplicationError {
    
     /**
     * Creates an instance of JobNotCompletedError.
     *
     * @param {string} [message='The job has not been completed yet'] - The error message.
     */
    constructor(message: string = 'the job has not been completed yet') {
        super('RequestParsingError', message, StatusCodes.BAD_REQUEST);
    }
}

/**
 * Factory class for creating different types of errors.
 *
 * @class ErrorFactory
 */
class ErrorFactory {
    /**
     * Creates an error instance based on the error type.
     *
     * @param {ErrorType} type - The type of error to create.
     * @param {string} [message] - The error message.
     * @param {any} [options] - Additional options for creating the error.
     * @returns {IAppError} The created error instance.
     */
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
            case ErrorType.UnzipError:
                return new UnzipError(message);
            case ErrorType.DirectoryRmError:
                return new DirectoryRmError(message);
            default:
                return new GenericError(message);
        }
    }
}

// Export all necessary elements for external use.
export { ErrorType, ErrorFactory, IAppError, ApplicationError };
