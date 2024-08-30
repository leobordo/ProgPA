import { Role } from "../models/request";

const jwt = require('jsonwebtoken');
const fs = require('fs');


// User informations
//const user = {
//    email: 'prova@gmail.com',
//    name: 'John Doe'
//};

// Carica la chiave privata


function generateToken(email: string, role: Role) {
    const privateKey = (process.env.RSA_PRIVATE_KEY)!.replace(/\\n/g, '\n')
    const tokenDuration = 60 * 60 * 24  // expires in 1 day
    // Dati dell'utente e altre informazioni del token
    const payload = {
        email: email,  // identificativo dell'utente
        iat: Math.floor(Date.now() / 1000),  // issued at
        exp: Math.floor(Date.now() / 1000) + tokenDuration,  
        aud: "https://prog_pa/",
        role: role
    };

    // Opzioni del token
    const signOptions = {
        algorithm: 'RS256',
    };

    // Genera il token
    const token = jwt.sign(payload, privateKey, signOptions);
    return token;
}


export {generateToken}