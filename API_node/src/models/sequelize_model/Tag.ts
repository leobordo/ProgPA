/**
 * @fileOverview Tag Model Initialization for Sequelize.
 *
 * This module defines the Tag model for use with Sequelize, a promise-based Node.js ORM. 
 * The model represents the structure of the 'tags' table in the database, including its 
 * associations with other models such as Dataset.
 */

import { Model, DataTypes, Sequelize } from 'sequelize';
import { Dataset } from './Dataset';

/**
 * Represents a Tag entry in the database.
 * 
 * @class
 * @extends Model
 */
export class Tag extends Model {
    public dataset_id!: number;
    public tag!: string;
}

/**
 * Initializes the Tag model.
 *
 * This function sets up the Tag model in Sequelize with its schema, including fields and data types. 
 * It also configures table options such as table name, timestamps, and indexes. The model represents
 * tags associated with datasets.
 *
 * @param {Sequelize} sequelize - An instance of Sequelize, representing a connection to the database.
 */
export function initializeTag(sequelize: Sequelize): void {
    Tag.init({
        dataset_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'datasets',
                key: 'dataset_id'
            }
        },
        tag: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    }, {
        sequelize,
        tableName: 'tags',
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['dataset_id', 'tag'] 
            }
        ]
    });
    Tag.removeAttribute('id');   
}
