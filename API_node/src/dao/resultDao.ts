import { ModelId } from "../models/aiModels";
import { JobStatus } from "../models/job";
import { Result } from "../models/sequelize_model/Result";

const ResultDAO = {
    
    //Stores a new job 
    async createJob(jobId: string, jobStatus: JobStatus, modelId: ModelId, modelVersion: string, datasetId:number) {
        return await Result.create({
            jobId: jobId,
            state: jobStatus,
            modelId: modelId,
            datasetId: datasetId,
            modelVersion: modelVersion
        });
    },
    
    //Updates the state of the specified job (by Id)
    async updateJobStatus(jobId: string, newJobStatus: JobStatus) {
        await Result.update(
            { state: newJobStatus }, 
            { where: { jobId: jobId}}
        );
    },

    //Gets the status of the job with the specified Id
    async getJob(jobId: string) {
        const result = await Result.findOne({
            where: {
                jobId: jobId,
            }
        });
        if (result) {
            return result;
        }
        throw Error("Job not found");
    }
}

export default ResultDAO;