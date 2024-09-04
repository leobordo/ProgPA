/**
 * @fileOverview User Model Initialization for Sequelize.
 *
 * This module defines the User model for use with Sequelize, a promise-based Node.js ORM. 
 * The model represents the structure of the 'users' table in the database, including its 
 * associations with other models such as Dataset.
 */

import { Model, DataTypes, Sequelize } from 'sequelize';
import { Dataset } from './Dataset';
import { Role } from '../request';

/**
 * Represents a User entry in the database.
 * 
 * @class
 * @extends Model
 */
export class User extends Model {
    public email!: string;          
    public password!: string;       
    public role!: Role;             
    public tokens!: number;     
}

/**
 * Initializes the User model.
 *
 * This function sets up the User model in Sequelize with its schema, including fields and data types. 
 * It also configures table options such as table name, timestamps, and the primary key.
 *
 * @param {Sequelize} sequelize - An instance of Sequelize, representing a connection to the database.
 */
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
