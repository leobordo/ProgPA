// Importing necessary enums and models for handling AI model IDs, job statuses, and errors.
import { ModelId } from "../models/aiModels";
import { JobStatus } from "../models/job";
import { Dataset } from "../models/sequelize_model/Dataset";
import { Result } from "../models/sequelize_model/Result";
import { ErrorFactory, ErrorType } from "../utils/errorFactory";

// Define a Data Access Object (DAO) for interacting with 'Result' entities in the database.
const ResultDAO = {

    /**
     * Creates a new job in the database.
     * @param jobId The unique identifier for the job.
     * @param jobStatus The initial status of the job.
     * @param modelId The ID of the object detection model used by the job.
     * @param modelVersion The version of the object detection model.
     * @param dataset_id The id of the dataset to infer on.
     * @returns {Promise<Result>} A Promise resolving to the newly created Result object.
     */
    async createJob(jobId: string, jobStatus: JobStatus, modelId: ModelId, modelVersion: string, dataset_id: number) {
        try {
            const newJob = await Result.create({
                job_id: jobId,
                state: jobStatus,
                model_id: modelId,
                dataset_id: dataset_id,
                model_version: modelVersion
            });
            return newJob;
        } catch (error) {
            // Log the error and throw a formatted database error.
            console.error(error);
            throw ErrorFactory.createError(ErrorType.DatabaseError);
        }
    },

    /**
     * Updates the status of a specific job.
     * @param jobId The ID of the job to update.
     * @param newJobStatus The new status to set for the job.
     * @returns {Promise<Result | null>} A Promise resolving to the updated Result object, or null if no updates were made.
     */
    async updateJobStatus(jobId: string, newJobStatus: JobStatus) {
        try {
            // Attempt to update the 'state' field of the Result record identified by jobId.
            const [affectedCount, affectedRows] = await Result.update(
                { state: newJobStatus },
                { where: { job_id: jobId }, returning: true }
            );

            // Check if the update affected any rows and return the first affected row if so.
            if (affectedCount > 0) {
                return affectedRows[0];
            }
            // Return null if no rows were updated.
            return null;
        } catch (error) {
            // Throw a database error if an exception occurs.
            throw ErrorFactory.createError(ErrorType.DatabaseError);
        }
    },

    /**
     * Updates the result of a specific job.
     * @param jobId The ID of the job to update.
     * @param result The result data to set for the job.
     * @returns {Promise<Result | null>} A Promise resolving to the updated Result object, or null if no updates were made.
     */
    async updateJobResult(jobId: string, result: string) {
        try {
            // Attempt to update the 'result' field of the Result record identified by jobId.
            const [affectedCount, affectedRows] = await Result.update(
                { result: result },
                { where: { job_id: jobId }, returning: true }
            );

            // Check if the update affected any rows and return the first affected row if so.
            if (affectedCount > 0) {
                return affectedRows[0];
            }
            // Return null if no rows were updated.
            return null;
        } catch (error) {
            // Throw a database error if an exception occurs.
            throw ErrorFactory.createError(ErrorType.DatabaseError);
        }
    },

    /**
     * Retrieves a job by its ID, ensuring it belongs to the user making the request.
     * @param jobId The ID of the job to retrieve.
     * @param userEmail The email of the user requesting the job.
     * @returns {Promise<Result | null>} A Promise resolving to the Result object if found, or null otherwise.
     */
    async getUserJobByID(jobId: string, userEmail: string) {
        try {
            // Find a single Result record that matches the job ID and belongs to the user's dataset.
            const job = await Result.findOne({
                include: [{
                    model: Dataset,   // Join with the Dataset table.
                    required: true,  // Ensure the dataset is associated with the result.
                    where: { email: userEmail }  // Filter datasets by user email.
                }],
                where: {
                    job_id: jobId,   // Filter results by job ID.
                }
            });
            return job;
        } catch (error) {
            // Throw a database error if an exception occurs.
            throw ErrorFactory.createError(ErrorType.DatabaseError);
        }
    },

    /** 
    * Retrieve jobs associated with a specific user email.
    * @param {string} userEmail - The email of the user.
    * @returns {Promise<Array<Result>>} - The jobs associated to the user.
    */
    async getJobsByUserEmail(userEmail: string) {
        try {
            const jobs: Array<Result> = await Result.findAll({
                include: [{
                    model: Dataset,
                    required: true,
                    where: { email: userEmail, is_deleted: false }
                }],
                attributes: ['job_id', 'state', 'dataset_id']
            });
            return jobs;
        } catch (error) {
            /* Throw a database error if the operation fails. */
            throw ErrorFactory.createError(ErrorType.DatabaseError);
        }
    },
}

// Export the ResultDAO for use elsewhere in the application.
export default ResultDAO;
