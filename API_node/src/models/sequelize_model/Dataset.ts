/**
 * @fileOverview Dataset Model Initialization for Sequelize.
 *
 * This module defines the Dataset model for use with Sequelize, a promise-based Node.js ORM (Object-Relational Mapping) for 
 * PostgreSQL, MySQL, MariaDB, SQLite, and Microsoft SQL Server. The model represents the structure of the 'datasets' table in 
 * the database and includes fields for storing dataset-related information such as file path, email, token cost, dataset name, 
 * and a flag for logical deletion.
 */

import { Model, DataTypes, Sequelize } from 'sequelize';

/**
 * Dataset class extending Sequelize's Model.
 *
 * This class defines the Dataset model, which maps to the 'datasets' table in the database. 
 * It includes fields such as dataset ID, email, file path, token cost, dataset name, and a logical deletion flag.
 */
export class Dataset extends Model {
    public dataset_id!: number;     
    public email!: string;          
    public file_path!: string;      
    public token_cost!: number;     
    public dataset_name!: string;   
    public is_deleted!: boolean;    
}

/**
 * Initializes the Dataset model.
 *
 * This function sets up the Dataset model in Sequelize with its schema, including fields, data types, and associations. 
 * It also configures table options such as table name, indexing, and timestamps.
 *
 * @param {Sequelize} sequelize - An instance of Sequelize, representing a connection to the database.
 */

export function initializeDataset(sequelize: Sequelize): void {
    Dataset.init({
        dataset_id: {
            type: DataTypes.INTEGER,        
            primaryKey: true,               
            autoIncrement: true             
        },
        email: {
            type: DataTypes.STRING(255),    
            allowNull: false,               
            references: {
                model: 'users',             
                key: 'email'                
            }
        },
        file_path: {
            type: DataTypes.TEXT,           
            allowNull: true
        },
        token_cost: {
            type: DataTypes.FLOAT,          
            allowNull: true                 
        },
        dataset_name: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        is_deleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false 
        }
    }, {
        sequelize,
        tableName: 'datasets',
        timestamps: false,
        indexes: [
            
            {
                unique: true,
                fields: ['file_path', 'email']
            },
            {
                unique: true,
                fields: ['dataset_id', 'dataset_name']
            }
        ]
    });

    
}


