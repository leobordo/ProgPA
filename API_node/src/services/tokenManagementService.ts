/**
 * @fileoverview This module provides services for managing and verifying user token balances.
 * It interacts with the user DAO (Data Access Object) to fetch and update user data
 */
import { Transaction } from 'sequelize';                            // Import Transaction to handle database transactions.
import userDao from '../dao/userDao';                               // Import the userDao to interact with the user data.
import { User } from '../models/sequelize_model/User';              // Import the User model definition.
import { ErrorFactory, ErrorType } from '../utils/errorFactory';    // Import utilities for creating standardized errors.

/**
 * Checks if a user has enough tokens to cover a given cost.
 * @param userEmail The email of the user whose token balance is to be checked.
 * @param token_cost The cost in tokens to be verified against the user's balance.
 * @returns A Promise that resolves to a boolean indicating if the user has sufficient tokens.
 * @throws Will throw an error if the user cannot be found.
 */
const checkTokenAvailability = async (userEmail: string, token_cost: number): Promise<boolean> => {
    const user: User | null = await userDao.getUserByEmail(userEmail);
    if (!user) {
        throw ErrorFactory.createError(ErrorType.UserNotFound);
    }
    if (user.tokens >= token_cost) {
        return true;
    }
    return false;
};

/**
 * Updates the token balance of a specified user by adding a specified amount.
 * @param userEmail The email of the user whose token balance is being updated.
 * @param tokenFlowAmount The amount to add (or to subtract, if negative) to the user's token balance.
 * @param transaction Optional transaction context to perform the update atomically.
 * @returns A Promise resolving to the new token balance after the update.
 * @throws Will throw an error if the user is not found or if the update fails.
 */
const updateTokenBalance = async (userEmail: string, tokenFlowAmount: number, transaction: Transaction | null = null): Promise<number> => {
    const user: User | null = await userDao.getUserByEmail(userEmail);
    if (!user) {
        throw ErrorFactory.createError(ErrorType.UserNotFound);
    }
    const newBalance: number = Number(user.tokens) + Number(tokenFlowAmount);
    const updatedUser: User | null = await userDao.updateTokenBalanceByEmail(userEmail, newBalance, transaction);
    if (!updatedUser) {
        throw ErrorFactory.createError(ErrorType.Generic, "It hasn't been possible to update user's token balance");
    }
    return updatedUser.tokens;
};

/**
 * Retrieves the current token balance of a user.
 * @param userEmail The email of the user whose token balance is to be retrieved.
 * @returns A Promise resolving to the current token balance.
 * @throws Will throw an error if the user is not found.
 */
const getTokenBalance = async (userEmail: string): Promise<number> => {
    const user: User | null = await userDao.getUserByEmail(userEmail);
    if (!user) {
        throw ErrorFactory.createError(ErrorType.UserNotFound);
    }
    return user.tokens;
};

export { checkTokenAvailability, updateTokenBalance, getTokenBalance };
