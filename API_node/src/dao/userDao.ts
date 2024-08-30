import { error } from "console";
import { Utente } from "../models/sequelize_model/Utente";
import { Transaction } from "sequelize";

const UserDAO = {
    
    //Updates the token balance of the specified user (by ID) with the value of newTokenBalance
    async updateTokenBalanceByEmail(userEmail: string, newTokenBalance: number, transaction: Transaction | null = null) {
        const [updateCount, updatedUsers] = await Utente.update(
            { tokens: newTokenBalance },
            { 
                where: { email: userEmail },
                returning: true,
                transaction
            }
        );

        if (updateCount > 0) {
            return updatedUsers[0];
        }
        throw error("Update failed");
    },

    //Gets the user's informations by his email 
    async getUserByEmail(userEmail: string) {
        const user = await Utente.findOne({
            where: {email: userEmail}
        });
        if (user) {
            return user;
        }
        throw error ("User not found");
    }



}

export default UserDAO;