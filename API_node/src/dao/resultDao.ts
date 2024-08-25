import { ModelId } from "../models/aiModels";
import { JobStatus } from "../models/job";
import { Result } from "../models/sequelize_model/Result";

const ResultDAO = {
    
    //Stores a new job 
    async createJob(jobId: string, jobStatus: JobStatus, modelId: ModelId, modelVersion: string, dataset_id:number) {
        return await Result.create({
            job_id: jobId,
            state: jobStatus,
            model_id: modelId,
            dataset_id: dataset_id,
            model_version: modelVersion
        });
    },
    
    //Updates the state of the specified job (by Id)
    async updateJobStatus(jobId: string, newJobStatus: JobStatus) {
        await Result.update(
            { state: newJobStatus }, 
            { where: { job_id: jobId}}
        );
    },

    //Gets the status of the job with the specified Id
    async getJob(jobId: string) {
        const result = await Result.findOne({
            where: {
                job_id: jobId,
            }
        });
        if (result) {
            return result;
        }
        throw Error("Job not found");
    }
}

export default ResultDAO;