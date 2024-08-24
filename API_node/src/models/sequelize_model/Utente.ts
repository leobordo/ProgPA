import { Model, DataTypes, Sequelize } from 'sequelize';


export class Utente extends Model {
    public email!: string; // `email` è obbligatorio
    public tokens!: number; // `tokens` è opzionale e ha un valore di default

    
}

export function initializeUtente(sequelize: Sequelize): void {
    Utente.init({
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            primaryKey: true
        },
        tokens: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 1000
        }
    }, {
        sequelize,
        tableName: 'utenti',
        timestamps: true, 
        modelName: 'Utente'
    });
}
