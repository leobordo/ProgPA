/**
 * @fileOverview Dataset Data Access Object (DAO) Module.
 *
 * This module provides a set of methods to interact with the `Dataset`, `Tag`, and `Result` models in the database.
 * It includes functionality for creating, retrieving, updating, and deleting datasets and tags, as well as handling
 * transactions and error management. This DAO abstracts the database operations, making it easier to manage datasets
 * within the application.
 */

import { Dataset } from '../models/sequelize_model/Dataset';        // Import the Dataset model from sequelize_model
import { Result } from '../models/sequelize_model/Result';          // Import the Result model from sequelize_model
import { Tag } from '../models/sequelize_model/Tag';                // Import the Tag model from sequelize_model
import { ErrorFactory, ErrorType} from '../utils/errorFactory';     // Import custom error handling utilities
import { sequelize } from '../config/sequelize';                    // Import Sequelize instance for transactions

/** 
 * Dataset Data Access Object (DAO)
 * Provides methods to interact with Dataset and Tag models in the database.
 */
const DatasetDAO = {
    
    /** 
     * Retrieve all tags associated with a dataset.
     * @param {number} dataset_id - The ID of the dataset.
     * @param {any} [transaction] - Optional Sequelize transaction object.
     * @returns {Promise<Tag[]>} A list of tags associated with the dataset.
     */
    async getTags(dataset_id: number, transaction?: any) {
        try {
            /* Find all tags where the dataset_id matches the provided ID. */
            return await Tag.findAll({
                where: { dataset_id: dataset_id },  
                attributes: ['tag'],        
                transaction: transaction    
            });
        } catch (err) {
            /* Throw a database error if the operation fails. */
            throw ErrorFactory.createError(ErrorType.DatabaseError);
        }
    },

    /** 
     * Create a new dataset.
     * @param {string} dataset_name - The name of the dataset.
     * @param {string} userEmail - The email of the user who owns the dataset.
     * @returns {Promise<Dataset | null>} The newly created dataset.
     */
    async create(dataset_name: string, userEmail: string) {
        const transaction = await sequelize.transaction(); // Start a new transaction
    
        try {
            // Create a new dataset with the provided name and user email.
            let newDataset: Dataset|null = await Dataset.create({
                dataset_name: dataset_name,
                email: userEmail,
                file_path: '',
                is_deleted: false,
                token_cost: 0
            }, { transaction }); // Pass transaction here
    
            // Retrieves the dataset ID
            const datasetId: number = newDataset.dataset_id;
    
            // Constructs the new file path using the dataset ID
            const updatedFilePath = `/user/uploads/${datasetId}`;
    
            // Updates the file_path with the newly created dataset ID
            await Dataset.update(
                { file_path: updatedFilePath },
                { where: { dataset_id: datasetId }, transaction }  
            );
    
            newDataset = await Dataset.findByPk(datasetId, { transaction });

            // Commit the transaction
            await transaction.commit();
            return newDataset;
        } catch (err) {
            // Rollback the transaction if any operation fails
            await transaction.rollback();
            throw ErrorFactory.createError(ErrorType.DatabaseError);
        }
    },

    /** 
     * Create a new tag for a dataset.
     * @param {number} dataset_id - The ID of the dataset.
     * @param {string} tag - The tag to be created.
     * @param {any} [transaction] - Optional Sequelize transaction object.
     * @returns {Promise<Tag>} The newly created tag.
     */
    async createTag(dataset_id: number, tag: string, transaction?: any) {
        try {
            /* Create a new tag for the specified dataset. */
            return await Tag.create({
                dataset_id: dataset_id,  // Set dataset_id
                tag: tag  // Set tag
            },
            {
                transaction: transaction  
            });
        } catch (err) {
            /* Throw a database error if the operation fails. */
            throw ErrorFactory.createError(ErrorType.DatabaseError);
        }
    },

    /** 
     * Retrieve all datasets associated with a specific user email.
     * @param {string} userEmail - The email of the user.
     * @param {any} [transaction] - Optional Sequelize transaction object.
     * @returns {Promise<Dataset[]>} A list of datasets associated with the user.
     */
    async getAllByUserEmail(userEmail: string, transaction?: any) {
        try {
            /* Find all datasets where the email matches and the dataset is not deleted. */
            return await Dataset.findAll({
                where: { email: userEmail, is_deleted: false },  
                transaction: transaction  
            });
        } catch (err) {
            /* Throw a database error if the operation fails. */
            throw ErrorFactory.createError(ErrorType.DatabaseError);
        }
    },

    /** 
     * Update the name of a dataset.
     * @param {string} dataset_name - The current name of the dataset.
     * @param {string} userEmail - The email of the user who owns the dataset.
     * @param {string} [newName] - The new name for the dataset.
     * @param {any} [transaction] - Optional Sequelize transaction object.
     * @returns {Promise<string>} Success message upon successful update.
     */
    async updateDsByName(dataset_name: string, userEmail: string, newName?: string, transaction?: any) {
        try {
            /* Update only the dataset name */
            const [affectedRows, updatedDatasets] = await Dataset.update(
                { dataset_name: newName },  // New dataset name
                {
                    where: { dataset_name: dataset_name, email: userEmail, is_deleted: false },  
                    returning: true,  // Return the updated dataset
                    transaction: transaction  
                }
            );
            return "Dataset name updated successfully";  // Return success message
        } catch (err) {
            /* Throw a database error if the operation fails. */
            throw ErrorFactory.createError(ErrorType.DatabaseError);
        }
    },

    /** 
     * Delete tags by dataset ID.
     * @param {number} dataset_id - The ID of the dataset whose tags are to be deleted.
     * @param {any} [transaction] - Optional Sequelize transaction object.
     * @returns {Promise<number>} The number of tags deleted.
     */
    async deleteTagsbyId(dataset_id: number, transaction?: any) {
        try {
            /* Delete all tags where the dataset_id matches the provided ID. */
            return await Tag.destroy({
                where: { dataset_id: dataset_id },  
                transaction: transaction  
            });
        } catch (err) {
            /* Throw a database error if the operation fails. */
            throw ErrorFactory.createError(ErrorType.DatabaseError); 
        }
    },

    /** 
     * Soft delete a dataset by marking it as deleted.
     * @param {string} dataset_name - The name of the dataset to be deleted.
     * @param {string} userEmail - The email of the user who owns the dataset.
     * @returns {Promise<void>} Resolves when the dataset is marked as deleted.
     */
    async softDeleteByName(dataset_name: string, userEmail: string) {
        try {
            /* Mark the dataset as deleted by setting is_deleted to true. */
            await Dataset.update(
                { is_deleted: true },  
                { where: { dataset_name: dataset_name, email: userEmail } }  
            );
        } catch (err) {
            /* Throw a database error if the operation fails. */
            throw ErrorFactory.createError(ErrorType.DatabaseError);
        }
    },

    /** 
     * Retrieve a dataset by its name and user email.
     * @param {string} dataset_name - The name of the dataset.
     * @param {string} userEmail - The email of the user who owns the dataset.
     * @param {any} [transaction] - Optional Sequelize transaction object.
     * @returns {Promise<Dataset>} The dataset if found.
     */
    async getDatasetByName(dataset_name: string, userEmail: string, transaction?: any) {
        try {
            /* Find one dataset where the name matches the provided dataset name and email. */
            const dataset = await Dataset.findOne({
                where: { dataset_name: dataset_name, email: userEmail, is_deleted: false },  
                transaction: transaction  // Use the provided transaction if any
            });
            return dataset;  
        } catch (err) {
            /* Throw a database error if the operation fails. */
            throw ErrorFactory.createError(ErrorType.DatabaseError);
        }
    },

    /** 
     * Update the token cost for a dataset by its name.
     * @param {string} dataset_name - The name of the dataset.
     * @param {string} userEmail - The email of the user who owns the dataset.
     * @param {number} additionalCost - The additional cost to add to the current token cost.
     * @returns {Promise<void>} Resolves when the token cost is updated.
     */
    async updateTokenCostByName(dataset_name: string, userEmail: string, token_cost: number, additionalCost: number) {
        try {
            /* Calculate the new token cost by adding the additional cost to the current token cost. */
            const newTokenCost = Number(token_cost) + Number(additionalCost);
            await Dataset.update(
                { token_cost: newTokenCost },  // Set the new token cost
                { where: { dataset_name: dataset_name, email: userEmail } }  // Condition to match dataset_name and email
            );
        } catch (err) {
            /* Throw a database error if the operation fails. */
            throw ErrorFactory.createError(ErrorType.DatabaseError);
        }
    },

    /** 
     * Retrieve a dataset by job ID.
     * @param {string} jobId - The job ID associated with the dataset.
     * @returns {Promise<Dataset | null>} - The dataset if found.
     */
    async getDatasetByJobId(jobId: string) {
        try {
            /* Find one dataset where the job_id matches the provided job ID. */
            const dataset = await Dataset.findOne({
                include: [{
                    model: Result,  
                    required: true,  
                    where: { job_id: jobId }  
                }]
            });
            return dataset;  // Return the found dataset
        } catch (err) {
            /* Throw a database error if the operation fails. */
            throw ErrorFactory.createError(ErrorType.DatabaseError);
        }
    },
};

/* Export the DatasetDAO object as the default export. */
export default DatasetDAO;
