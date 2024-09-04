/**
 * @fileOverview Authentication and Registration Controller Module.
 *
 * This module provides controller functions for handling user login and registration processes.
 * It interacts with the login services to authenticate users and create new user accounts, 
 * and responds with appropriate HTTP status codes and messages.
 */

import { NextFunction, Request, Response } from 'express';
import * as loginService from '../services/loginServices'
import HTTPStatus from 'http-status-codes'; 

/**
 * User login controller.
 *
 * This function handles user login requests by validating the provided email and password.
 * It uses the login service to authenticate the user and generate a JWT token, 
 * which is then sent back in the response.
 *
 * @param {Request} req - Express request object containing user credentials.
 * @param {Response} res - Express response object for sending the response.
 * @param {NextFunction} next - Express next middleware function for error handling.
 * @returns {Promise<void>} - Sends a JSON response with a success message and JWT token or passes an error to the next middleware.
 */
const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Authenticate user and get JWT token
        const access_token:string = await loginService.login(email!, password!);

        // Create response object with JWT token
        const response: Object = {message: "Logged in", jwt_token: access_token};
        res.status(HTTPStatus.OK).send(response);
    }
    catch (error) {
        next(error);
    }
}

/**
 * User registration controller.
 *
 * This function handles user registration requests by creating a new user account
 * with the provided email and password. It uses the registration service to add the user
 * and responds with a success message and initial token balance.
 *
 * @param {Request} req 
 * @param {Response} res 
 * @param {NextFunction} next 
 * @returns {Promise<void>} 
 */
const registration = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    try {
        const { email, password } = req.body;

        // Register new user
        const createdUser = await loginService.registration(email, password);
        
        // Create response object with registration details
        const response = {message: "Registration completed", email: createdUser.email, token_balance: createdUser.tokens};
        res.status(HTTPStatus.CREATED).json(response);
    } catch (error) {
        next(error);
    }
}

export { login, registration };