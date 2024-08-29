import * as Joi from 'joi';
import { ModelId, Yolov8Version } from '../../models/aiModels';
import { Role } from '../../models/request';

export const createDatasetSchema = Joi.object({
    datasetName: Joi.string().min(3).max(40).required(),
    tags: Joi.string().max(80).required()
});

export const deleteDatasetSchema = Joi.object({
    datasetName: Joi.string().min(3).max(40).required()
});

export const updateDatasetSchema = Joi.object({
    datasetName: Joi.string().min(3).max(40).required(),
    newDatasetName: Joi.string().min(3).max(40),
    newTags: Joi.string().max(80)
});

export const uploadContentsSchema = Joi.object({
    datasetName: Joi.string().min(3).max(40).required(),
});

export const tokensTopUpSchema = Joi.object({
    topUpUserEmail: Joi.string().email().required(),
    topUpAmount: Joi.number().min(1).max(20000).required()
});

export const makeInferenceSchema = Joi.object({
    modelId: Joi.string().valid(ModelId.YoloV8).required(),
    modelVersion: Joi.string().valid(Yolov8Version.Medium, Yolov8Version.Small).required(),
    datasetName: Joi.string().min(3).max(40).required()
});

export const getJobStatusSchema = Joi.object({
    jobId: Joi.number().integer().required()
});

export const getJobResultSchema = Joi.object({
    jobId: Joi.number().integer().required()
});

export const userSchema = Joi.object({
    userEmail: Joi.string().email().required(),
    userRole: Joi.string().valid(Role.Admin, Role.User).required()
});


