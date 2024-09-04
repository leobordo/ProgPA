/**
 * @fileOverview User Role Enumerations and Payload Interface.
 *
 * This module defines enumerations for user roles and an interface for user payloads used in authentication.
 * It also extends the Express Request interface to include user information after authentication.
 */

/**
 * Enumeration of user roles.
 *
 * This enum represents the different roles a user can have within the application.
 *
 * @enum {number}
 */
enum Role {
    User = 1,
    Admin = 0,
}

/**
 * Interface for representing the user payload in JWT.
 *
 * This interface defines the structure of the user payload encoded in JWT, including user details 
 * and token metadata.
 *
 * @interface
 */
interface UserPayload {
    email: string;
    role: number;
    iat: number;
    exp:number;
    aud: string;
}

/**
 * Extends Express Request interface to include user information.
 *
 * This declaration extends the Express Request interface by adding an optional 'user' property, which
 * includes user's email and role. It allows middleware to attach user details to the request object after authentication.
 */
declare module 'express-serve-static-core' {
    interface Request {
      user?: {
        userEmail: string;
        userRole: Role;
      };
    }
  }

export {Role, UserPayload};