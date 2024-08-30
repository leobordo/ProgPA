import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Creazione di un pool di connessione al database
const dbUser = process.env.POSTGRES_USER;
const dbHost = process.env.POSTGRES_HOST;
const dbName = process.env.POSTGRES_DB;
const dbPassword = process.env.POSTGRES_PASSWORD;
const dbPort = process.env.POSTGRES_PORT;

if (!dbUser || !dbHost || !dbName || !dbPassword || !dbPort) {
  throw new Error('Una o più variabili d\'ambiente del database non sono definite.');
}

// Creazione di un pool di connessione al database
const pool = new Pool({
  user: dbUser,
  host: dbHost,
  database: dbName,
  password: dbPassword,
  port: parseInt(dbPort, 10), // Converte la porta in un numero
});

// Funzione per ottenere i job correlati a un utente dal database
export const getJobsByUserEmail = async (email: string) => {
  try {
    const query = `
      SELECT r.*
      FROM results r
      JOIN datasets d ON r.dataset_id = d.dataset_id
      WHERE d.email = $1
    `;
    const result = await pool.query(query, [email]);
    return result.rows;
  } catch (error) {
    console.error('Errore nel recupero dei job:', error);
    throw error;
  }
};

// Funzione per ascoltare le notifiche PostgreSQL
export const listenForJobUpdates = (onJobUpdate: (payload: any) => void) => {
  pool.connect((err, client) => {
    
    if (err || !client) {  // Aggiunto controllo per 'client'
      console.error('Errore durante la connessione al database:', err);
      throw err; // O gestisci l'errore come appropriato per la tua applicazione
    }

    client.on('notification', (msg) => {
      const payload = JSON.parse(msg.payload!);
      console.log('Ricevuta notifica dal database:', payload);
      onJobUpdate(payload); // Callback con i dati della notifica
    });

    client.query('LISTEN job_notifications'); // Ascolta il canale delle notifiche configurato
  });
};