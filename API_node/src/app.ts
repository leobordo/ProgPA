/**
 * @fileOverview Main server configuration and initialization module.
 *
 * This module sets up the Express server along with its middleware, routes, and WebSocket server.
 * It handles the following key functionalities:
 * 
 * - Loads environment variables from the .env file.
 * - Configures and initializes middleware for authentication and error handling.
 * - Defines API routes for user management, datasets, token management, inference, and file uploads.
 * - Initializes Sequelize models and synchronizes them with the database.
 * - Starts the Express server on a specified port and a WebSocket server on a separate port.
 * - Ensures graceful shutdown of the server and database connections upon termination signals.
 *
 * The module is designed to be the entry point for starting the server, integrating all necessary components
 * to support both HTTP and WebSocket communication for a comprehensive backend service.
 */

import datasetRouter from './routers/datasetRouter';
import tokenManagementRouter from './routers/tokenManagementRouter';
import inferenceRouter from './routers/inferenceRouter';
import uploadRouter from './routers/uploadRouter';
import loginRouter from './routers/loginRouter';
import {sequelize,  initializeModels } from './config/sequelize'; 
import dotenv from 'dotenv';
import { createServer, Server } from 'http';
import {AuthenticationMiddleware} from './middlewares/authMiddleware';
import { Request, Response, NextFunction } from 'express';
import startWebSocketServer from './websocket/websocketServer'; 
import { ErrorHandlingMiddleware } from './middlewares/errorHandlingMiddleware';
import { IAppError } from './utils/errorFactory';

// Loading environment variables from .env file
dotenv.config();
require('dotenv').config();         

// Initialize Express application
const express = require('express');
const app = express();
const server: Server = createServer(app);

// Global authentication middleware (except for registration and login routes)
/**
 * Middleware to enforce authentication on all routes except for registration and login.
 * This ensures secure access control across the application.
 */
const authenticationMiddleware = new AuthenticationMiddleware();
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/user')) {
      return next();
  }
  authenticationMiddleware.handle(req, res, next);
});

// Define application routes
/**
 * Route definitions for the application.
 * Each router handles a specific set of endpoints for modularity and organization.
 */
app.use('/user', loginRouter);
app.use('/datasets', datasetRouter);
app.use('/token', tokenManagementRouter);
app.use('/inference', inferenceRouter);
app.use('/upload', uploadRouter);

// Global error handling middleware
/**
 * Global middleware to handle errors across the application.
 * Catches and processes errors, ensuring a consistent error response format.
 */
const errorHandlingMiddleware = new ErrorHandlingMiddleware();
app.use((err: IAppError, req: Request, res: Response, next: NextFunction) => {
  errorHandlingMiddleware.handle(req, res, next, err);
});

// Initialize Sequelize models
initializeModels(sequelize)

/**
 * Synchronizes the Sequelize models with the database and starts the Express server.
 * Also initiates the WebSocket server on a separate port for handling real-time connections.
 */
sequelize.sync({ force: false }).then(() => {
  console.log("Database synchronized");

  // Start the Express server on the specified port
  const PORT = process.env.EXPRESS_PORT || 3000;  
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  // Start the WebSocket server on a separate port
  startWebSocketServer();
}).catch((error: Error) => {
  console.error("Unable to synchronize the database:", error);
});


// Handle graceful shutdown of the server and database connection
/**
 * Handles the graceful shutdown of the server and database connections.
 * Ensures all connections are properly closed when the server is terminated.
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');

    // Close the database connection
    sequelize.close().then(() => {
      console.log('Database connection closed');
    }).catch((error: Error) => {
      console.error('Failed to close database connection:', error);
    });
  });
});
