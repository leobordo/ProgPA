import { error } from "console";
import { User } from "../models/sequelize_model/User";
import { Transaction } from "sequelize";

const UserDAO = {
    
    //Updates the token balance of the specified user (by ID) with the value of newTokenBalance
    async updateTokenBalanceByEmail(userEmail: string, newTokenBalance: number, transaction: Transaction | null = null) {
        const [updateCount, updatedUsers] = await User.update(
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
        const user = await User.findOne({
            where: {email: userEmail}
        });
        return user;
    },

    //Gets the user's informations by his email and password
    //used when user has not a token 
    async getUserByEmailAndPsw(userEmail: string, psw: string) {
        const user  = await User.findOne({
            where: {email: userEmail,
                password: psw
            }
        });
        return user;
    },

    //Create a new user
    async createUser(email: string, psw:string){
        return await User.create({
            email: email,
            password:psw
        })
    }



}

export default UserDAO;