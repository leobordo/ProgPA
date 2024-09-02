import { ModelId } from "../models/aiModels";
import { JobStatus } from "../models/job";
import { Dataset } from "../models/sequelize_model/Dataset";
import { Result } from "../models/sequelize_model/Result";
import { ErrorFactory, ErrorType } from "../utils/errorFactory";

const ResultDAO = {

    //Stores a new job 
    async createJob(jobId: string, jobStatus: JobStatus, modelId: ModelId, modelVersion: string, dataset_id: number) {
        try {
            return await Result.create({
                job_id: jobId,
                state: jobStatus,
                model_id: modelId,
                dataset_id: dataset_id,
                model_version: modelVersion
            });
        } catch (error) {
            console.error(error);
            throw ErrorFactory.createError(ErrorType.DatabaseError);
        }
    },

    //Updates the state of the specified job (by Id)
    async updateJobStatus(jobId: string, newJobStatus: JobStatus) {
        try {
            const [affectedCount, affectedRows] = await Result.update(
                { state: newJobStatus },
                { where: { job_id: jobId }, returning: true }
            );

            if (affectedCount > 0) {            // Check if any rows were updated
                return affectedRows[0];         // Return the updated row
            }
            return null;                        // Return null if no rows were updated
        } catch (error) {
            throw ErrorFactory.createError(ErrorType.DatabaseError);
        }
    },

    //Updates the state of the specified job (by Id)
    async updateJobResult(jobId: string, result: string) {
        try {
            const [affectedCount, affectedRows] = await Result.update(
                { result: result },
                { where: { job_id: jobId }, returning: true }
            );

            if (affectedCount > 0) {            // Check if any rows were updated
                return affectedRows[0];         // Return the updated row
            }
            return null;                        // Return null if no rows were updated
        } catch (error) {
            throw ErrorFactory.createError(ErrorType.DatabaseError);
        }
    },

    //Gets the job with the specified Id (only if the job belongs to the requesting user)
    async getUserJobByID(jobId: string, userEmail: string) {
        try {
            return await Result.findOne({
                include: [{
                    model: Dataset,
                    required: true,
                    where: { email: userEmail }
                }],
                where: {
                    job_id: jobId,
                }
            });
        } catch (error) {
            throw ErrorFactory.createError(ErrorType.DatabaseError);
        }
    }
}

export default ResultDAO;