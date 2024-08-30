import datasetRouter from './routers/datasetRouter';
import tokenManagementRouter from './routers/tokenManagementRouter';
import inferenceRouter from './routers/inferenceRouter';
import uploadRouter from './routers/uploadRouter';
import sequelize from './config/sequelize'; // Importa l'istanza di Sequelize configurata
import dotenv from 'dotenv';
import { initializeUtente as initializeUtente } from './models/sequelize_model/Utente';
import { initializeDataset as initializeDataset } from './models/sequelize_model/Dataset';
import { createAssociation, initializeResult } from './models/sequelize_model/Result';
import { createServer, Server } from 'http';
import {AuthenticationMiddleware} from './middlewares/authMiddleware';
import { Request, Response, NextFunction } from 'express';
import { initializeTag } from './models/sequelize_model/Tag';
import startWebSocketServer from './websocket/websocketServer'; // Importa il server WebSocket

// Carica le variabili di ambiente dal file .env
dotenv.config();
require('dotenv').config();         // Loading environment variables from .env file
const express = require('express');
const bodyParser = require('body-parser');


const app = express();
const server: Server = createServer(app);

// Middleware per l'analisi dei body delle richieste
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const authenticationMiddleware = new AuthenticationMiddleware();
app.use((req : Request, res : Response, next : NextFunction) => authenticationMiddleware.handle(req, res, next));

// Definizione delle rotte
app.use('/datasets', datasetRouter);
app.use('/token', tokenManagementRouter);
app.use('/inference', inferenceRouter);
app.use('/upload', uploadRouter);



initializeUtente(sequelize);
initializeDataset(sequelize);
initializeResult(sequelize);
initializeTag(sequelize)
createAssociation()
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
