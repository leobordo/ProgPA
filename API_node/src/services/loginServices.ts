import UserDAO from "../dao/userDao"
import { Role } from "../models/request"
import { User } from "../models/sequelize_model/User";
import { ErrorFactory, ErrorType } from "../utils/errorFactory"
const jwt = require('jsonwebtoken');

export const login = async (email: string, password: string) => {
    const user: User | null = await UserDAO.getUserByEmailAndPsw(email, password);
    if (!user) {
        throw ErrorFactory.createError(ErrorType.UserNotFound);
    }

    const token: string = generateToken(user.email, user.role);
    return token;
}

export const registration = async (email: string, password: string) => {
    const existingUser: User | null = await UserDAO.getUserByEmail(email);
    if (existingUser) {
        throw ErrorFactory.createError(ErrorType.DuplicateUser)
    }

    const createdUser: User = await UserDAO.createUser(email, password);
    return createdUser;
}

function generateToken(email: string, role: Role) {
    const privateKey: string = (process.env.RSA_PRIVATE_KEY)!.replace(/\\n/g, '\n');
    const tokenDuration: number = Number(process.env.TOKEN_DURATION) || 86400; // expires in 1 day
    // Dati dell'utente e altre informazioni del token
    const payload = {
        email: email,  // identificativo dell'utente
        iat: Math.floor(Date.now() / 1000),  // issued at
        exp: Math.floor(Date.now() / 1000) + tokenDuration,
        aud: process.env.TOKEN_AUD,
        iss: process.env.TOKEN_DURATION,
        role: role
    };

    // Opzioni del token
    const signOptions = {
        algorithm: (process.env.TOKEN_SIGNING_ALGORITHM)!,
    };

    // Genera il token
    const token: string = jwt.sign(payload, privateKey, signOptions);
    return token;
}