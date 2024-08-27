import * as Joi from 'joi';
import { ModelId, Yolov8Version } from '../../models/aiModels';
import { Role } from '../../models/request';

export const detectionModelSchema = Joi.object({
    modelId: Joi.string().valid(ModelId.YoloV8).required(),
    modelVersion: Joi.string().valid(Yolov8Version.Medium, Yolov8Version.Small).required()
});

export const userSchema = Joi.object({
    userEmail: Joi.string().email().required(),
    userRole: Joi.string().valid(Role.Admin, Role.User).required()
});

export const jobIdSchema = Joi.object({
    jobId: Joi.number().integer().required()
});

export const datasetNameSchema = Joi.object({
    datasetName: Joi.string().min(3).max(40).required()
});

export const newDatasetSchema = Joi.object({
    newDatasetName: Joi.string().min(3).max(40).required(),
    newTags: Joi.string().max(80).required()
});

export const datasetTagsSchema = Joi.object({
    tags: Joi.string().max(80).required()
});

export const topUpSchema = Joi.object({
    topupUserEmail: Joi.string().email().required(),
    topUpAmount: Joi.number().min(1).max(20000).required()
});

