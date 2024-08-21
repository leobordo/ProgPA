import express from 'express';
import bodyParser from 'body-parser';
import dataRouter from './routers/dataRouter';
import tokenManagementRouter from './routers/tokenManagementRouter';
import inferenceRouter from './routers/inferenceRouter';
import sequelize from './config/sequelize'; // Importa l'istanza di Sequelize configurata
import dotenv from 'dotenv';
import { initializeUtente as initializeUtente } from './models/Utente';
import { initializeContent as initializeContent } from './models/Content';
import { initializeDataset as initializeDataset } from './models/Dataset';
import { initializeResults } from './models/Result';

// Carica le variabili di ambiente dal file .env
dotenv.config();

const app = express();

// Middleware per l'analisi dei body delle richieste
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Definizione delle rotte
app.use('/datasets', dataRouter);
app.use('/token', tokenManagementRouter);
app.use('/inference', inferenceRouter);

initializeUtente(sequelize);
initializeDataset(sequelize);
initializeContent(sequelize);
initializeResults(sequelize);
// Sincronizza il database e avvia il server
sequelize.sync({ force: false }).then(() => {
  console.log("Database synchronized");
  const PORT = process.env.POSTGRES_PORT || 5432;  
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch((error) => {
  console.error("Unable to synchronize the database:", error);
});

// Gestione della chiusura del server e della connessione al database
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  app.close(() => {
    console.log('HTTP server closed');

    sequelize.close().then(() => {
      console.log('Database connection closed');
    }).catch((error) => {
      console.error('Failed to close database connection:', error);
    });
  });
});
