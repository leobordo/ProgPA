import WebSocket from 'ws';
import { authenticateWebSocket } from './websocketAuth';
import DatasetDAO from '../dao/datasetDao'
import { Result } from '../models/sequelize_model/Result';
import { sendUserMessage, MessageType, messageTemplates } from '../websocket/websocketMessages'; // Importa le funzioni di messaggi centralizzati

// Mappa per tenere traccia delle connessioni WebSocket per utente
const userSockets = new Map<string, Set<WebSocket>>();


// Funzione per inviare la lista dei job all'utente
const sendJobListToUser = async (socket: WebSocket, userEmail: string) => {
    try {
        console.log(`Recupero job per l'utente con email: ${userEmail}`);

        // Recupera i job associati all'utente dal DAO
        const jobs = await DatasetDAO.getJobsByUserEmail(userEmail);

        const jobMessage = messageTemplates[MessageType.JobList]({ userEmail });

        // Usa il tipo Result per specificare il tipo del job
        const formattedJobs = jobs.map((job: Result) => ({
            job_id: job.job_id,
            state: job.state,
            dataset_id: job.dataset_id
        }));

    

        const response = {
            message: jobMessage,
            jobs: formattedJobs
        };


        // Invia l'array come stringa JSON
        socket.send(JSON.stringify(response));
    } catch (error) {
        console.error('Errore nel recupero dei job:', error);
        socket.send(JSON.stringify({ type: 'error', message: 'Errore nel recupero dei job.' }));
    }
};




// Funzione per gestire la connessione WebSocket
const handleWebSocketConnection = async (socket: WebSocket, userEmail: string) => {
    
    // Invia la lista dei job all'utente quando si connette per la prima volta
    sendJobListToUser(socket, userEmail);

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
};


// Definizione del server WebSocket
let wss: WebSocket.Server;  

const startWebSocketServer = () => {
    const WEBSOCKET_PORT = 8080;
    wss = new WebSocket.Server({ port: WEBSOCKET_PORT });

    wss.on('connection', (socket, request) => {
        console.log('WebSocket connection attempt');

        authenticateWebSocket(socket, request, () => {
            console.log('WebSocket connection established and authenticated');
            const userEmail = (socket as any).user?.email;

           

            if (userEmail) {

                sendUserMessage(userEmail, MessageType.Welcome, { userEmail });
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
        });
    });

    console.log(`WebSocket server is running on port ${WEBSOCKET_PORT}`);
};




// Funzione per inviare un messaggio sullo status del job solo all'utente specifico
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
