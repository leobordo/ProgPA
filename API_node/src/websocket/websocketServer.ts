/**
 * @fileoverview WebSocket Server and Connection Management Module
 *
 * This module manages WebSocket connections for real-time communication with users.
 * It includes:
 * - Initialization and configuration of the WebSocket server (`startWebSocketServer`).
 * - Authentication of WebSocket connections (`authenticateWebSocket`).
 * - Management of user-specific WebSocket connections through a tracking map (`userSockets`).
 * - Sending messages to users based on different events and states (e.g., job status updates, welcome messages).
 * - Handling of WebSocket connection lifecycle events, including establishing, closing, and managing active connections.
 *
 * The module is designed to support real-time updates and notifications for users, ensuring
 * that messages are sent accurately and connections are maintained efficiently.
 */

import WebSocket from 'ws';
import { authenticateWebSocket } from './websocketAuth';
import DatasetDAO from '../dao/resultDao'
import { Result } from '../models/sequelize_model/Result';
import { sendUserMessage, MessageType, messageTemplates } from '../websocket/websocketMessages'; // Importa le funzioni di messaggi centralizzati

// Map to keep track of WebSocket connections per user.
const userSockets = new Map<string, Set<WebSocket>>();

/**
 * Retrieves and sends the list of jobs associated with the user to the WebSocket connection.
 *
 * This function fetches all jobs linked to the user's email from the database, formats them,
 * and sends the formatted list of jobs back to the user via their WebSocket connection.
 *
 * @param {WebSocket} socket - The active WebSocket connection for the user.
 * @param {string} userEmail - The email of the user for whom the job list is being retrieved.
 */
const sendJobListToUser = async (socket: WebSocket, userEmail: string) => {
    try {
        console.log(`Recupero job per l'utente con email: ${userEmail}`);

        // Retrieve jobs associated with the user from the DAO
        const jobs = await DatasetDAO.getJobsByUserEmail(userEmail);

        // Get the job list message template
        const jobMessage = messageTemplates[MessageType.JobList]({ userEmail });

        // Extract relevant job information for the user from the retrieved data
        const formattedJobs = jobs.map((job: Result) => ({
            job_id: job.job_id,
            state: job.state,
            dataset_id: job.dataset_id
        }));

        // Create a response object to send back
        const response = {
            message: jobMessage,
            jobs: formattedJobs
        };

        // Send the array as a JSON string
        socket.send(JSON.stringify(response));
    } catch (error) {
        console.error('Errore nel recupero dei job:', error);
        socket.send(JSON.stringify({ type: 'error', message: 'Errore nel recupero dei job.' }));
    }
};

/**
 * Handles the WebSocket connection for a user.
 *
 * This function manages the setup of a WebSocket connection for a specific user, 
 * sending the initial list of jobs and managing the connection lifecycle, 
 * including adding and removing the socket from the user tracking map.
 *
 * @param {WebSocket} socket - The WebSocket connection for the user.
 * @param {string} userEmail - The email of the user connecting via WebSocket.
 */
const handleWebSocketConnection = async (socket: WebSocket, userEmail: string) => {
    
    // Send the job list to the user when they first connect.
    sendJobListToUser(socket, userEmail);

        // Add the socket to the map of user connections if it doesn't already exist
        if (!userSockets.has(userEmail)) {
            userSockets.set(userEmail, new Set());
        }

        // Add the socket to the user's set of sockets
        userSockets.get(userEmail)!.add(socket);

        // Remove the socket from the map when the connection is closed
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

// WebSocket server instance
let wss: WebSocket.Server;  

/**
 * Starts the WebSocket server on a specified port.
 *
 * This function initializes a WebSocket server and sets up event listeners to handle new connections,
 * authenticate users, manage incoming messages, and handle disconnections.
 */
const startWebSocketServer = () => {
    const WEBSOCKET_PORT = 8080;
    wss = new WebSocket.Server({ port: WEBSOCKET_PORT });

    // Event listener for new WebSocket connections
    wss.on('connection', (socket, request) => {
        console.log('WebSocket connection attempt');

        // Authenticate the WebSocket connection
        authenticateWebSocket(socket, request, () => {
            console.log('WebSocket connection established and authenticated');
            
            // Retrieve the user email from the socket after authentication
            const userEmail = (socket as any).user?.email;

            // If user email is found, handle the connection
            if (userEmail) {

                // Send a welcome message to the user
                sendUserMessage(userEmail, MessageType.Welcome, { userEmail });
                
                // Handle WebSocket connection setup for the user
                handleWebSocketConnection(socket, userEmail);
            } else {
                // Send an error message if the email is not found in the JWT token
                socket.send(JSON.stringify({ type: 'error', message: 'Email non trovata nel token JWT.' }));
                socket.close(1008, 'User email not found');
            }

            // Event listener for receiving messages from the client
            socket.on('message', (message) => {
                const messageString = message.toString();
                console.log('Received message:', messageString);
            });

            // Event listener for when the WebSocket connection is closed
            socket.on('close', () => {
                console.log('WebSocket connection closed');
            });
        });
    });

    console.log(`WebSocket server is running on port ${WEBSOCKET_PORT}`);
};

/**
 * Sends a job status message only to the specific user.
 *
 * @param {string} userEmail - The email of the user to whom the message is to be sent.
 * @param {any} message - The message object to be sent to the user.
 */
export const sendMessageToUser = (userEmail: string, message: any) => {
    const sockets = userSockets.get(userEmail);
    if (sockets) {
        
        // Iterate over each socket and send the message if the socket is open
        sockets.forEach(socket => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify(message));
            }
        });
    }
  };

export default startWebSocketServer;
