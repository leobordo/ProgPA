/**
 * @fileOverview This module provides data access functionality specifically for the 'User' (Sequelize) model.
 *               It encapsulates the logic required to interact with the database for operations related to users,
 *               such as creating a new user, updating user information, and retrieving user details based on email or credentials.
 */
import { User } from "../models/sequelize_model/User";
import { Transaction } from "sequelize";                            // Import Sequelize's Transaction model to handle transactions.
import { ErrorFactory, ErrorType } from "../utils/errorFactory";    // Error handling utilities.

const UserDAO = {
    
    /**
     * Updates the token balance of a specified user identified by email.
     * @param userEmail The email of the user whose token balance is to be updated.
     * @param newTokenBalance The new token balance to set for the user.
     * @param transaction An optional Sequelize transaction object to perform the update as part of a transaction.
     * @returns A Promise that resolves to the updated User object, or null if no updates were made.
     */
    async updateTokenBalanceByEmail(userEmail: string, newTokenBalance: number, transaction: Transaction | null = null) {
        try {
            // Perform the update on the tokens field for the user specified by email.
            const [affectedCount, affectedRows] = await User.update(
                { tokens: newTokenBalance },
                { 
                    where: { email: userEmail },
                    returning: true, // Asks Sequelize to return the updated object.
                    transaction
                }
            );

            // Check if any rows were affected and return the first affected row if so.
            if (affectedCount > 0) {
                return affectedRows[0];
            }
            // Return null if no rows were updated.
            return null;
        } catch (error) {
            // Handle errors by throwing a database error.
            throw ErrorFactory.createError(ErrorType.DatabaseError);
        }
    },

    /**
     * Retrieves a user's information by their email.
     * @param userEmail The email of the user to retrieve.
     * @returns A Promise resolving to the User object if found, or null otherwise.
     */
    async getUserByEmail(userEmail: string) {
        try {
            // Find a user by their email.
            return await User.findOne({
                where: {email: userEmail}
            });
        } catch (error) {
            // Handle errors by throwing a database error.
            throw ErrorFactory.createError(ErrorType.DatabaseError);
        }
    },

    /**
     * Retrieves a user's information by their email and password.
     * This method is typically used for authentication purposes when a user does not have a token.
     * @param userEmail The email of the user.
     * @param psw The password of the user.
     * @returns A Promise resolving to the User object if found, or null otherwise.
     */
    async getUserByEmailAndPsw(userEmail: string, psw: string) {
        try {
            // Find a user by their email and password.
            return await User.findOne({
                where: {email: userEmail, password: psw}
            });
        } catch (error) {
            // Handle errors by throwing a database error.
            throw ErrorFactory.createError(ErrorType.DatabaseError);
        }
    },

    /**
     * Creates a new user in the database.
     * @param email The email of the new user.
     * @param psw The password for the new user.
     * @returns A Promise resolving to the newly created User object.
     */
    async createUser(email: string, psw: string, token_amount: number){
        try {
            // Create a new user record.
            return await User.create({
                email: email,
                password: psw,
                tokens: token_amount
            })
        } catch (error) {
            // Handle errors by throwing a database error.
            throw ErrorFactory.createError(ErrorType.DatabaseError);
        }
    }
}

export default UserDAO;
