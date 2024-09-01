import { Transaction } from 'sequelize';
import userDao from '../dao/userDao';
import { User } from '../models/sequelize_model/User';

// Check if the tokens owned by the specified user (by email) are sufficient to perform the requested operation
const checkTokenAvailability = async (userEmail: string, token_cost: number): Promise<boolean> => {
    const user = await userDao.getUserByEmail(userEmail);
    if (!user){
        throw Error("User not found")
    }
    if (user.tokens >= token_cost) {
        console.log("tokens: " + user.tokens)
        return true;
    }
    return false;
};

// Update the token balance of the specified user (by email) adding the specified amount (positive or negative)
// Return the amount of the user's new token balance 
const updateTokenBalance = async (userEmail: string, tokenFlowAmount: number, transaction: Transaction | null = null): Promise<number> => {
    const user = await userDao.getUserByEmail(userEmail);
    if (!user){
        throw Error
    }
    const newBalance:number = Number(user.tokens) + Number(tokenFlowAmount);
    const updatedUser:User = await userDao.updateTokenBalanceByEmail(userEmail, newBalance, transaction);
    return updatedUser.tokens;
};

// Adds the job to the queue and returns its ID which can be used later to check the job status and/or retrieve its result
const getTokenBalance = async (userEmail: string): Promise<number> => {
    const user = await userDao.getUserByEmail(userEmail);
    if (!user){
        throw Error
    }
    return user.tokens;
};

export {checkTokenAvailability, updateTokenBalance, getTokenBalance};