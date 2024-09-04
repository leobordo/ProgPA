/**
 * @fileOverview Result Model Initialization and Associations for Sequelize.
 *
 * This module defines the Result model for use with Sequelize, a promise-based Node.js ORM. 
 * The model represents the structure of the 'results' table in the database, including associations 
 * with other models such as Dataset, User, and Tag. It also initializes these associations to establish 
 * relationships between different entities in the database.
 */

import { Model, DataTypes, Sequelize } from 'sequelize';
import { JobStatus } from '../jobStatus';
import { ModelId } from '../aiModels';
import { Dataset } from './Dataset';
import { User } from './User';
import { Tag } from './Tag';

/**
 * Represents a Result entry in the database.
 * 
 * @class
 * @extends Model
 */
export class Result extends Model {
    public job_id!: string;             // Unique identifier for the job
    public result?: string;             // Result of the inference; optional field
    public state!: JobStatus;           // Current status of the job
    public model_id!: ModelId;          // Identifier of the AI model used for inference
    public dataset_id!: number;         // Identifier of the associated dataset
    public model_version!: string;      // Version of the model used for inference
}

/**
 * Initializes the Result model.
 *
 * This function sets up the Result model in Sequelize with its schema, including fields and data types. 
 * It also configures table options such as table name and timestamps.
 *
 * @param {Sequelize} sequelize - An instance of Sequelize, representing a connection to the database.
 */
export function initializeResult(sequelize: Sequelize): void {
    Result.init({
        job_id: {
            type: DataTypes.STRING,     
            primaryKey: true            
        },
        result: {
            type: DataTypes.TEXT,
            allowNull: true 
        },
        state: {
            type: DataTypes.STRING,
            allowNull: false
        },
        model_id: {
            type: DataTypes.STRING,
            allowNull: false
        },
        dataset_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'datasets',
                key: 'dataset_id'
            }
        },
        model_version: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        sequelize,
        tableName: 'results',
        timestamps: false
    });
}

/**
 * Establishes associations between models.
 *
 * This function creates associations between different models in the database, such as Dataset, User, Result, and Tag.
 * It defines the relationships (e.g., one-to-many, many-to-one) between these models, establishing foreign key constraints 
 * to maintain referential integrity.
 *
 * @function
 */
export function createAssociation() : void {
    Dataset.belongsTo(User, { foreignKey: 'email'});
    Dataset.hasMany(Result, { foreignKey: 'dataset_id', as: 'results' });
    User.hasMany(Dataset, { foreignKey: 'email', as: 'datasets' });
    Result.belongsTo(Dataset, { foreignKey: 'dataset_id'});
    Dataset.hasMany(Tag, { foreignKey: 'dataset_id', as: 'tags' });
    Tag.belongsTo(Dataset, { foreignKey: 'dataset_id', as: 'dataset' });
}


