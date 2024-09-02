import WebSocket from 'ws';
import { authenticateWebSocket } from './websocketAuth';
import DatasetDAO from '../dao/datasetDao';

// Mappa per tenere traccia delle connessioni WebSocket per utente
const userSockets = new Map<string, Set<WebSocket>>();


// Funzione per gestire la connessione WebSocket
const handleWebSocketConnection = async (socket: WebSocket, userEmail: string) => {
    try {
        console.log(`Recupero job per l'utente con email: ${userEmail}`);
        const jobs = await DatasetDAO.getJobsByUserEmail(userEmail);
        socket.send(JSON.stringify({ type: 'job_list', data: jobs }));

        // Aggiungi il socket alla mappa degli utenti
        if (!userSockets.has(userEmail)) {
            userSockets.set(userEmail, new Set());
        }
        userSockets.get(userEmail)!.add(socket);

        // Rimuovi il socket dalla mappa quando si disconnette
        socket.on('close', () => {
            const sockets = userSockets.get(userEmail);
            if (sockets) {
                sockets.delete(socket);
                if (sockets.size === 0) {
                    userSockets.delete(userEmail);
                }
            }
        });
    } catch (error) {
        console.error('Errore nel recupero dei job:', error);
        socket.send(JSON.stringify({ type: 'error', message: 'Errore nel recupero dei job.' }));
    }
};


// Definizione del server WebSocket
let wss: WebSocket.Server;  // Dichiarazione del server WebSocket a livello di modulo

const startWebSocketServer = () => {
    const WEBSOCKET_PORT = 8080;
    wss = new WebSocket.Server({ port: WEBSOCKET_PORT });

    wss.on('connection', (socket, request) => {
        console.log('WebSocket connection attempt');

        authenticateWebSocket(socket, request, () => {
            console.log('WebSocket connection established and authenticated');
            const userEmail = (socket as any).user?.email;

            if (userEmail) {
                handleWebSocketConnection(socket, userEmail);
            } else {
                socket.send(JSON.stringify({ type: 'error', message: 'Email non trovata nel token JWT.' }));
                socket.close(1008, 'User email not found');
            }

            socket.on('message', (message) => {
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

// Funzione per inviare un messaggio solo all'utente specifico
export const sendMessageToUser = (userEmail: string, message: any) => {
    const sockets = userSockets.get(userEmail);
    if (sockets) {
        sockets.forEach(socket => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify(message));
            }
        });
    }
};

export default startWebSocketServer;
