/**
 * @fileoverview This module contains functions for user authentication, including login and registration functionalities.
 * It interacts with the UserDAO to access and modify user data, and utilizes JWT for generating authentication tokens.
 */
import UserDAO from "../dao/userDao"; // Import User Data Access Object for interacting with the user data.
import { Role } from "../models/request"; // Import the Role type, used to manage user roles within the system.
import { User } from "../models/sequelize_model/User"; // Import the User model to represent user data.
import { ErrorFactory, ErrorType } from "../utils/errorFactory"; // Import utilities for error handling.
const jwt = require('jsonwebtoken'); // Require jsonwebtoken for generating JWTs.

/**
 * Authenticates a user with their email and password, and generates a JWT token if authentication is successful.
 * @param email The email of the user attempting to log in.
 * @param password The password of the user.
 * @returns A JWT token if authentication is successful.
 * @throws UserNotFound error if the user cannot be found or the password is incorrect.
 */
export const login = async (email: string, password: string) => {
    // Attempt to retrieve the user by email and password.
    const user: User | null = await UserDAO.getUserByEmailAndPsw(email, password);
    if (!user) {
        // If no user is found, throw an error indicating the user does not exist.
        throw ErrorFactory.createError(ErrorType.UserNotFound);
    }

    // Generate a JWT token for the authenticated user.
    const token: string = generateToken(user.email, user.role);
    return token;
}

/**
 * Registers a new user with an email and password.
 * @param email The email of the new user.
 * @param password The password for the new user.
 * @returns The newly created User object.
 * @throws DuplicateUser error if a user with the given email already exists.
 */
export const registration = async (email: string, password: string) => {
    // Check if a user already exists with the given email.
    const existingUser: User | null = await UserDAO.getUserByEmail(email);
    if (existingUser) {
        // If a user exists, throw a DuplicateUser error.
        throw ErrorFactory.createError(ErrorType.DuplicateUser);
    }

    // Create a new user in the database.
    const createdUser: User = await UserDAO.createUser(email, password);
    return createdUser;
}

/**
 * Generates a JWT token for a user.
 * @param email The email of the user.
 * @param role The role of the user.
 * @returns A JWT token.
 */
function generateToken(email: string, role: Role) {
    // Retrieve and format the private key from environment variables.
    const privateKey: string = (process.env.RSA_PRIVATE_KEY)!.replace(/\\n/g, '\n');
    const tokenDuration: number = Number(process.env.TOKEN_DURATION) || 86400; // Token expires in 1 day by default.

    // Define the payload for the JWT, including user details and token information.
    const payload = {
        iat: Math.floor(Date.now() / 1000),                 // Issued at time
        exp: Math.floor(Date.now() / 1000) + tokenDuration, // Expiry time
        aud: process.env.TOKEN_AUD,                         // Audience
        iss: process.env.TOKEN_ISSUER,                      // Issuer
        email: email,                                       // User identifier
        role: role                                          // User role
    };

    // Define token signing options
    const signOptions = {
        algorithm: (process.env.TOKEN_SIGNING_ALGORITHM)!,
    };

    // Generate and return the JWT.
    const token: string = jwt.sign(payload, privateKey, signOptions);
    return token;
}
