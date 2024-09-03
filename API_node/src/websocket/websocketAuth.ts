import WebSocket from 'ws';
import jwt from 'jsonwebtoken';

// Carica la chiave pubblica dal file
const publicKey = (process.env.PUBLIC_KEY)!.replace(/\\n/g, '\n');

// Middleware per autenticare le connessioni WebSocket
export const authenticateWebSocket = (socket: WebSocket, request: any, next: () => void): void => {
    const authHeader = request.headers['authorization']; // Usa 'authorization' invece di 'sec-websocket-protocol'

    if (!authHeader) {
        console.log('Token not provided');
        socket.close(1008, 'Token not provided');
        return;
    }

    // Estrai il token dall'intestazione 'Authorization: Bearer <token>'
    const token = authHeader.split(' ')[1];

    if (!token) {
        console.log('Token not provided in Authorization header');
        socket.close(1008, 'Token not provided');
        return;
    }

    jwt.verify(token, publicKey, { 
        algorithms: ['RS256'],
        audience: process.env.TOKEN_AUD,
        issuer: process.env.TOKEN_ISSUER  
    }, (err, decoded) => {
        if (err) {
            console.log('Token invalid:', err);
            socket.close(1008, 'Invalid token');
            return;
        }

        // Allegare le informazioni utente al socket
        (socket as any).user = decoded;  // Assicurati che 'decoded' contenga le informazioni dell'utente


        console.log('Token verified, user connected');
        next();
    });
};
