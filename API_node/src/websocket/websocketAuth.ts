/**
 * @fileoverview WebSocket Authentication Middleware Module
 *
 * This module provides middleware to authenticate WebSocket connections using JWT (JSON Web Tokens).
 * It ensures that only clients with a valid token can establish a WebSocket connection.
 * 
 * Key functionalities:
 * - Loads the public key for verifying JWTs from an environment variable.
 * - Extracts and verifies the JWT from the WebSocket connection request headers.
 * - Closes the connection with an appropriate status code and message if authentication fails.
 * - Attaches user information to the WebSocket connection upon successful authentication.
 */

import WebSocket from 'ws';
import jwt from 'jsonwebtoken';

// Load the public key from the environment variable and format it correctly
const publicKey = (process.env.PUBLIC_KEY)!.replace(/\\n/g, '\n');

/**
 * Middleware to authenticate WebSocket connections.
 *
 * This function extracts the JWT from the request headers, verifies it using the public key,
 * and attaches the decoded user information to the WebSocket connection if the token is valid.
 * If the token is missing or invalid, it closes the connection with an appropriate error code and message.
 *
 * @param {WebSocket} socket - The WebSocket connection to be authenticated.
 * @param {any} request - The initial HTTP request that initiated the WebSocket connection, containing headers.
 * @param {Function} next - A callback function to proceed with the WebSocket connection if authentication is successful.
 */
export const authenticateWebSocket = (socket: WebSocket, request: any, next: () => void): void => {
    
    // Retrieve the 'Authorization' header from the WebSocket connection request
    const authHeader = request.headers['authorization']; 

    // If the 'Authorization' header is missing, close the connection with a 1008 status code
    if (!authHeader) {
        console.log('Token not provided');
        socket.close(1008, 'Token not provided');
        return;
    }

    // Extract the token from the 'Authorization' header (format: 'Bearer <token>')
    const token = authHeader.split(' ')[1];

    // If the token is missing after extraction, close the connection with a 1008 status code
    if (!token) {
        console.log('Token not provided in Authorization header');
        socket.close(1008, 'Token not provided');
        return;
    }

    // Verify the JWT using the public key and the RS256 algorithm
    jwt.verify(token, publicKey, { 
        algorithms: ['RS256'],
        audience: process.env.TOKEN_AUD,
        issuer: process.env.TOKEN_ISSUER  
    }, (err, decoded) => {
        if (err) {
            console.log('Token invalid:', err);
            socket.close(1008, 'Invalid token');
            return;
        }

        // Attach the decoded user information to the WebSocket connection
        (socket as any).user = decoded;  

        console.log('Token verified, user connected');
        // Proceed with the WebSocket connection
        next();
    });
};
