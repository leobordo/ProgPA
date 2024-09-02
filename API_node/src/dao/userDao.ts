import { error } from "console";
import { User } from "../models/sequelize_model/User";
import { Transaction } from "sequelize";
import { ErrorFactory, ErrorType } from "../utils/errorFactory";

const UserDAO = {
    
    //Updates the token balance of the specified user (by ID) with the value of newTokenBalance
    async updateTokenBalanceByEmail(userEmail: string, newTokenBalance: number, transaction: Transaction | null = null) {
        try {
            const [affectedCount, affectedRows] = await User.update(
                { tokens: newTokenBalance },
                { 
                    where: { email: userEmail },
                    returning: true,
                    transaction
                }
            );

            if (affectedCount > 0) {            // Check if any rows were updated
                return affectedRows[0];         // Return the updated row
            }
            return null;                        // Return null if no rows were updated
        } catch (error) {
            throw ErrorFactory.createError(ErrorType.DatabaseError);
        }
    },

    //Gets the user's informations by his email 
    async getUserByEmail(userEmail: string) {
        try {
            return await User.findOne({
                where: {email: userEmail}
            });
        } catch (error) {
            throw ErrorFactory.createError(ErrorType.DatabaseError);
        }
    },

    //Gets the user's informations by his email and password
    //used when user has not a token 
    async getUserByEmailAndPsw(userEmail: string, psw: string) {
        try {
            return await User.findOne({
                where: {email: userEmail, password: psw}
            });
        } catch (error) {
            throw ErrorFactory.createError(ErrorType.DatabaseError);
        }
    },

    //Create a new user
    async createUser(email: string, psw:string){
        try {
            return await User.create({
                email: email,
                password:psw
            })
        } catch (error) {
            throw ErrorFactory.createError(ErrorType.DatabaseError);
        }
    }



}

export default UserDAO;