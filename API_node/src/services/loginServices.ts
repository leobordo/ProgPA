import UserDAO from "../dao/userDao"
import { Role } from "../models/request"
//import { generateToken } from "../utils/tokenGenerator"
import { ErrorFactory, ErrorType } from "./errorFactory"
const jwt = require('jsonwebtoken');
const fs = require('fs');



export const login = async (email: string, password: string) => {

    const user = await UserDAO.getUserByEmailAndPsw(email, password)
    
    if (!user) {
        throw ErrorFactory.createError(ErrorType.UserNotFound)
    }

    try{
    const token = generateToken(user.email, user.role)
    const message = `Log in completed! User token: ${token}`;
    return message
    } catch(err)
    {
        throw err
    }
}
export const registration = async (email: string, password: string, confirmPassword: string) => {

        const user = await UserDAO.getUserByEmail(email)

        if (user) {
            throw ErrorFactory.createError(ErrorType.DuplicateUser)
        }
        try{
        await UserDAO.createUser(email, password)
        const message = `User created!`;
        return message
        } catch(err)
        {
            throw err
        }
    
} 

function generateToken(email: string, role: Role) {
    const privateKey = (process.env.RSA_PRIVATE_KEY)!.replace(/\\n/g, '\n')
    const tokenDuration = process.env.TOKEN_DURATION  // expires in 1 day
    // Dati dell'utente e altre informazioni del token
    const payload = {
        email: email,  // identificativo dell'utente
        iat: Math.floor(Date.now() / 1000),  // issued at
        exp: Math.floor(Date.now() / 1000) + tokenDuration,  
        aud: process.env.TOKEN_AUD,
        role: role
    };

    // Opzioni del token
    const signOptions = {
        algorithm: process.env.TOKEN_ALGORITHM,
    };

    // Genera il token
    const token = jwt.sign(payload, privateKey, signOptions);
    return token;
}