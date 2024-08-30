import WebSocket from 'ws';
import { Client } from 'pg';
import { authenticateWebSocket } from './websocketAuth'; // Importa il middleware
import { getJobsByUserEmail } from './websocketJob'; // Importa la funzione dal servizio

// Funzione per gestire la connessione WebSocket
const handleWebSocketConnection = async (socket: WebSocket, userEmail: string) => {
    try {
        console.log(`Recupero job per l'utente con email: ${userEmail}`);
        // Chiamata al service per ottenere i job correlati
        const jobs = await getJobsByUserEmail(userEmail);
      
        // Invia i job recuperati al client WebSocket
        socket.send(JSON.stringify({ type: 'job_list', data: jobs }));
    } catch (error) {
        console.error('Errore nel recupero dei job:', error);
        socket.send(JSON.stringify({ type: 'error', message: 'Errore nel recupero dei job.' }));
    }
};

const startWebSocketServer = () => {
    const WEBSOCKET_PORT = 8080; // Specifica una porta separata per il WebSocket
    const wss = new WebSocket.Server({ port: WEBSOCKET_PORT });

    // Configurazione del client PostgreSQL per ascoltare le notifiche
    const pgClient = new Client({
        user: process.env.POSTGRES_USER,
        host: process.env.POSTGRES_HOST,
        database: process.env.POSTGRES_DB,
        password: process.env.POSTGRES_PASSWORD,
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    });

    pgClient.connect()
        .then(() => {
            console.log('Connected to PostgreSQL for notifications.');
            pgClient.query('LISTEN job_notifications'); // Ascolta il canale delle notifiche
        })
        .catch((err) => {
            console.error('Failed to connect to PostgreSQL:', err);
        });

    pgClient.on('notification', (msg) => {
        const payload = JSON.parse(msg.payload || '{}');
        console.log('Notifica ricevuta dal database:', payload);
        // Invia la notifica a tutti i client connessi
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'job_update', data: payload }));
            }
        });
    });

    wss.on('connection', (socket, request) => {
        console.log('WebSocket connection attempt');

        // Utilizza il middleware per autenticare la connessione WebSocket
        authenticateWebSocket(socket, request, () => {
            console.log('WebSocket connection established and authenticated');

            // Ottieni l'email dell'utente dal socket autenticato
            const userEmail = (socket as any).user?.email;

            if (userEmail) {
                // Chiama la funzione per gestire la connessione WebSocket
                handleWebSocketConnection(socket, userEmail);
            } else {
                socket.send(JSON.stringify({ type: 'error', message: 'Email non trovata nel token JWT.' }));
                socket.close(1008, 'User email not found');
            }

            socket.on('message', (message) => {
                // Converte il buffer in una stringa
                const messageString = message.toString();
                console.log('Received message:', messageString);
            });

            socket.on('close', () => {
                console.log('WebSocket connection closed');
            });

            socket.send('Welcome to the WebSocket server!');
        });
    });

    console.log(`WebSocket server is running on port ${WEBSOCKET_PORT}`);
};

export default startWebSocketServer;