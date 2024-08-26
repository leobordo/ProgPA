import dataRouter from './routers/dataRouter';
import tokenManagementRouter from './routers/tokenManagementRouter';
import inferenceRouter from './routers/inferenceRouter';
import sequelize from './config/sequelize'; // Importa l'istanza di Sequelize configurata
import dotenv from 'dotenv';
import { initializeUtente as initializeUtente } from './models/sequelize_model/Utente';
import { initializeDataset as initializeDataset } from './models/sequelize_model/Dataset';
import { initializeResult } from './models/sequelize_model/Result';
import { createServer, Server } from 'http';
import {AuthenticationMiddleware} from './middlewares/authMiddleware';
import { Request, Response, NextFunction } from 'express';

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
app.use('/datasets', dataRouter);
app.use('/token', tokenManagementRouter);
app.use('/inference', inferenceRouter);



initializeUtente(sequelize);
initializeDataset(sequelize);
initializeResult(sequelize);

// Sincronizza il database e avvia il server
sequelize.sync({ force: false }).then(() => {
  console.log("Database synchronized");
  const PORT = process.env.EXPRESS_PORT || 3000;  
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
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
