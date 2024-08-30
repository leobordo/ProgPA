import { Model, DataTypes, Sequelize } from 'sequelize';
import { Dataset } from './Dataset';
import { Role } from '../request';


export class User extends Model {
    public email!: string; // `email` è obbligatorio
    public password!: string;
    public role!: Role;
    public tokens!: number; // `tokens` è opzionale e ha un valore di default

    
}

export function initializeUser(sequelize: Sequelize): void {
    User.init({
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            primaryKey: true
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        role: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        },
        tokens: {
            type: DataTypes.FLOAT,
            allowNull: true,
            defaultValue: 1000
        }
    }, {
        sequelize,
        tableName: 'users',
        timestamps: false, 
        modelName: 'User'
    });

    
}
