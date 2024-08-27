import userDao from '../dao/userDao';
import { Utente } from '../models/sequelize_model/Utente';

// Check if the tokens owned by the specified user (by email) are sufficient to perform the requested operation
const checkTokenAvailability = async (userEmail: string, token_cost: number): Promise<boolean> => {
    const user:Utente = await userDao.getUserByEmail(userEmail);
    if (user.tokens >= token_cost) {
        return true;
    }
    return false;
};

// Update the token balance of the specified user (by email) adding the specified amount (positive or negative)
// Return the amount of the user's new token balance 
const updateTokenBalance = async (userEmail: string, tokenFlowAmount: number): Promise<number> => {
    const user:Utente = await userDao.getUserByEmail(userEmail);
    const newBalance = user.tokens + tokenFlowAmount;
    const updatedUser:Utente = await userDao.updateTokenBalanceByEmail(userEmail, newBalance);
    return updatedUser.tokens;
};

// Adds the job to the queue and returns its ID which can be used later to check the job status and/or retrieve its result
const getTokenBalance = async (userEmail: string): Promise<number> => {
    const user:Utente = await userDao.getUserByEmail(userEmail);
    return user.tokens;
};

export {checkTokenAvailability, updateTokenBalance, getTokenBalance};