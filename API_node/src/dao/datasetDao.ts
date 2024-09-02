import { error } from 'console';
import { Dataset } from '../models/sequelize_model/Dataset'; // Import the Dataset model
import { Result } from '../models/sequelize_model/Result'; // Import the Result model
import { Tag } from '../models/sequelize_model/Tag'; // Import the Tag model
import { ErrorFactory, ErrorType, ApplicationError } from '../utils/errorFactory'; // Import error handling utilities

/**
 * Dataset Data Access Object (DAO)
 * Provides methods to interact with Dataset and Tag models in the database.
 */
const DatasetDAO = {
    /**
     * Get the maximum dataset ID from the Dataset table.
     * @returns {Promise<number | null>} The maximum dataset ID or null if none found.
     */
    async getMaxDatasetId() {
        try
        {const maxDatasetId = await Dataset.max('dataset_id');
        return maxDatasetId;}
        catch(err)
        {
            throw ErrorFactory.createError(ErrorType.DatabaseError)
        }
    },
    
    /**

    /**
     * Retrieve all tags associated with a dataset.
     * @param {number} dataset_id - The ID of the dataset.
     * @param {any} [transaction] - Optional Sequelize transaction object.
     * @returns {Promise<Tag[]>} A list of tags associated with the dataset.
     */
    async getTags(dataset_id: number, transaction?: any){
        try {
            return await Tag.findAll({
            where: {
                dataset_id: dataset_id
            },
            attributes: ['tag'],
            transaction: transaction
            });
        }catch(err){
            throw ErrorFactory.createError(ErrorType.DatabaseError)
            }
    },

    /**
     * Create a new dataset.
     * @param {string} dataset_name - The name of the dataset.
     * @param {string} userEmail - The email of the user who owns the dataset.
     * @param {string} file_path - The file path associated with the dataset.
     * @returns {Promise<Dataset>} The newly created dataset.
     */
    async create(dataset_name: string, userEmail: string) {
        try {
            const newDataset:Dataset = await Dataset.create({
                dataset_name: dataset_name,
                email: userEmail,
                file_path: '',  
                is_deleted: false,
                token_cost: 0
            });

            // Retrieves the dataset ID
            const datasetId:number = newDataset.dataset_id;

            // Constructs the new file path using the dataset ID
            const updatedFilePath = `/user/uploads/${datasetId}`; 

            // Updates the file_path with the newly created dataset ID
            await Dataset.update(
                { file_path: updatedFilePath },
                { where: { dataset_id: datasetId } }
            );

            // Return the updated dataset
            return await Dataset.findByPk(datasetId);
        } catch (err) {
            throw ErrorFactory.createError(ErrorType.DatabaseError)
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
       try{ return await Tag.create({
            dataset_id: dataset_id,
            tag: tag
        },
        {
            transaction: transaction
        });
        }catch(err){
            throw ErrorFactory.createError(ErrorType.DatabaseError)
        }
    },

    /**
     * Retrieve all datasets associated with a specific user email.
     * @param {string} userEmail - The email of the user.
     * @param {any} [transaction] - Optional Sequelize transaction object.
     * @returns {Promise<Dataset[]>} A list of datasets associated with the user.
     */
    async getAllByUserEmail(userEmail: string, transaction?: any) {
        try{return await Dataset.findAll({
            where: { email: userEmail, is_deleted: false },
            transaction: transaction
        });
        }catch(err){
            throw ErrorFactory.createError(ErrorType.DatabaseError)
        }
    },

    /**
     * Update the name of a dataset.
     * @param {string} dataset_name - The current name of the dataset.
     * @param {string} userEmail - The email of the user who owns the dataset.
     * @param {number} dataset_id - The ID of the dataset.
     * @param {string} [newName] - The new name for the dataset.
     * @param {any} [transaction] - Optional Sequelize transaction object.
     * @returns {Promise<string>} Success message upon successful update.
     * @throws {Error} Throws an error if the update fails.
     */
    async updateDsByName(
        dataset_name: string, 
        userEmail: string, 
        newName?: string,
        transaction?: any 
    ) {
        try {
            // Update only the dataset name
            const [affectedRows, updatedDatasets] = await Dataset.update(
                { dataset_name: newName }, 
                {
                    where: { dataset_name: dataset_name, email: userEmail, is_deleted: false },
                    returning: true,
                    transaction: transaction
                }
            );
            return "Dataset name updated successfully";
        } catch (err) {
            throw ErrorFactory.createError(ErrorType.DatabaseError);
        }
    },

    /**
     * Delete tags by dataset ID.
     * @param {number} dataset_id - The ID of the dataset whose tags are to be deleted.
     * @param {any} [transaction] - Optional Sequelize transaction object.
     * @returns {Promise<number>} The number of tags deleted.
     * @throws {Error} Throws an error if the deletion fails.
     */
    async deleteTagsbyId(dataset_id: number, transaction?: any) {
        try {
            return await Tag.destroy({
                where: {dataset_id: dataset_id},
                transaction: transaction
            });
        } catch (err) {
            throw ErrorFactory.createError(ErrorType.DatabaseError); // Throw generic error
        }
    },

    /**
     * Soft delete a dataset by marking it as deleted.
     * @param {string} dataset_name - The name of the dataset to be deleted.
     * @param {string} userEmail - The email of the user who owns the dataset.
     * @returns {Promise<void>} Resolves when the dataset is marked as deleted.
     */
    async softDeleteByName(dataset_name: string, userEmail: string) {
        try{await Dataset.update(
            { is_deleted: true },
            { where: { dataset_name: dataset_name, email: userEmail } }
        );}catch(err)
        {
            throw ErrorFactory.createError(ErrorType.DatabaseError)
        }
    },

    /**
     * Retrieve a dataset by its name and user email.
     * @param {string} dataset_name - The name of the dataset.
     * @param {string} userEmail - The email of the user who owns the dataset.
     * @param {any} [transaction] - Optional Sequelize transaction object.
     * @returns {Promise<Dataset>} The dataset if found.
     * @throws {Error} Throws an error if the dataset is not found.
     */
    async getDatasetByName(dataset_name: string, userEmail: string, transaction?: any) {
        try{const dataset = await Dataset.findOne({
            where: { dataset_name: dataset_name, email: userEmail, is_deleted: false },
            transaction: transaction,
        });
        return dataset;
        }catch(err)
        {
            throw ErrorFactory.createError(ErrorType.DatabaseError)
        }
    },

    /**
     * Update the token cost for a dataset by its name.
     * @param {string} dataset_name - The name of the dataset.
     * @param {string} userEmail - The email of the user who owns the dataset.
     * @param {number} additionalCost - The additional cost to add to the current token cost.
     * @returns {Promise<void>} Resolves when the token cost is updated.
     * @throws {Error} Throws an error if the dataset is not found.
     */
    async updateTokenCostByName(dataset_name: string, userEmail: string,token_cost: number, additionalCost: number) {
        try{
            const newTokenCost = Number(token_cost) + Number(additionalCost);
            await Dataset.update(
                { token_cost: newTokenCost },
                { where: { dataset_name: dataset_name, email: userEmail } }
            );
        }catch(err)
        {
            throw ErrorFactory.createError(ErrorType.DatabaseError)
        }
    },

    /**
     * Retrieve a dataset by job ID.
     * @param {string} jobId - The job ID associated with the dataset.
     * @returns {Promise<Dataset>} The dataset if found.
     * @throws {Error} Throws an error if the dataset is not found.
     */
    async getDatasetByJobId(jobId: string) {
        try{const dataset = await Dataset.findOne({
            include: [{
                model: Result,
                required: true, 
                where: { job_id: jobId }
            }]
        });
        return dataset
        }catch(err)
        {
            throw ErrorFactory.createError(ErrorType.DatabaseError)
        }
    },
};

export default DatasetDAO;
