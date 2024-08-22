const {inferenceQueue, inferenceQueueEvents} = require('./queue');

const requestDatasetInference = async (datasetName: string, user:string, modelId:string, modelVersion:string): Promise<object> => {
    // Adds the job to the queue
    const job = await inferenceQueue.add('processRequest', { datasetName, user, modelId, modelVersion });
    return job.id;
};

export {requestDatasetInference};