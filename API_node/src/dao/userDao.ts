import { Utente } from "../models/sequelize_model/Utente";

const UserDAO = {
    
    //Updates the token balance of the specified user (by ID) with the value of newTokenBalance
    async updateTokenBalance(userEmail: string, newTokenBalance: number) {
        return await Utente.update(
            { tokens: newTokenBalance}, 
            { 
                where: { email: userEmail},
                returning: true
            }
        );
    },

    //Gets the user's informations by his email 
    async getUserByEmail(userEmail: string) {
        return await Utente.findOne({
            where: {email: userEmail}
        });
    }

}

export default UserDAO;