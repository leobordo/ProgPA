import datasetRouter from './routers/datasetRouter';
import tokenManagementRouter from './routers/tokenManagementRouter';
import inferenceRouter from './routers/inferenceRouter';
import uploadRouter from './routers/uploadRouter';
import loginRouter from './routers/loginRouter';
import {sequelize,  initializeModels } from './config/sequelize'; // Importa l'istanza di Sequelize configurata
import dotenv from 'dotenv';
import { createServer, Server } from 'http';
import {AuthenticationMiddleware} from './middlewares/authMiddleware';
import { Request, Response, NextFunction } from 'express';
import startWebSocketServer from './websocket/websocketServer'; // Importa il server WebSocket
import { ErrorHandlingMiddleware } from './middlewares/errorHandlingMiddleware';
import { IAppError } from './utils/errorFactory';

// Loading environment variables from .env file

dotenv.config();
require('dotenv').config();         
const express = require('express');

const app = express();
const server: Server = createServer(app);


//Global authentication middleware (except for registration and login routes)
const authenticationMiddleware = new AuthenticationMiddleware();
app.use((req: Request, res: Response, next: NextFunction) => {
 
  if (req.path.startsWith('/user')) {
      return next();
  }

  authenticationMiddleware.handle(req, res, next);

});

// Definizione delle rotte
app.use('/user', loginRouter);
app.use('/datasets', datasetRouter);
app.use('/token', tokenManagementRouter);
app.use('/inference', inferenceRouter);
app.use('/upload', uploadRouter);

//Global error handling middleware
const errorHandlingMiddleware = new ErrorHandlingMiddleware();
app.use((err: IAppError, req: Request, res: Response, next: NextFunction) => {
  errorHandlingMiddleware.handle(req, res, next, err);
});

//Inizializza i modelli sequelize
initializeModels(sequelize)

// Sincronizza il database e avvia il server
sequelize.sync({ force: false }).then(() => {
  console.log("Database synchronized");
  const PORT = process.env.EXPRESS_PORT || 3000;  
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });


  // Avvia il server WebSocket su una porta separata
  startWebSocketServer();
}).catch((error: Error) => {
  console.error("Unable to synchronize the database:", error);
});


// Gestione della chiusura del server e della connessione al database
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');

    sequelize.close().then(() => {
      console.log('Database connection closed');
    }).catch((error: Error) => {
      console.error('Failed to close database connection:', error);
    });
  });
});
