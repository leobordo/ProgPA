import * as Joi from 'joi';
import { ModelId, Yolov8Version } from '../../models/aiModels';
import { Role } from '../../models/request';
import { VALIDATION_PARAMS as VP } from './validationParameters';

// Conversione dell'enum in un array di valori
const roles = Object.values(Role);
const modelIds = Object.values(ModelId);
const yolov8Versions = Object.values(Yolov8Version);

export const createDatasetSchema = Joi.object({
    datasetName: Joi.string().min(VP.MIN_DATASET_NAME_LENGTH).max(VP.MAX_DATASET_NAME_LENGTH).required(),
    tags: Joi.string().min(VP.MIN_TAG_LENGTH).max(VP.MAX_TAG_LENGTH).required()  //MODIFICARE
});

export const deleteDatasetSchema = Joi.object({
    datasetName: Joi.string().min(VP.MIN_DATASET_NAME_LENGTH).max(VP.MAX_DATASET_NAME_LENGTH).required(),
});

export const updateDatasetSchema = Joi.object({
    datasetName: Joi.string().min(VP.MIN_DATASET_NAME_LENGTH).max(VP.MAX_DATASET_NAME_LENGTH).required(),
    newDatasetName: Joi.string().min(VP.MIN_DATASET_NAME_LENGTH).max(VP.MAX_DATASET_NAME_LENGTH).required(),
    newTags: Joi.string().min(VP.MIN_TAG_LENGTH).max(VP.MAX_TAG_LENGTH).required()  //MODIFICARE
});

export const uploadContentsSchema = Joi.object({
    datasetName: Joi.string().min(VP.MIN_DATASET_NAME_LENGTH).max(VP.MAX_DATASET_NAME_LENGTH).required()
});

export const tokensTopUpSchema = Joi.object({
    topUpUserEmail: Joi.string().email().required(),
    topUpAmount: Joi.number().min(VP.MIN_TOPUP_AMOUNT).max(VP.MAX_TOPUP_AMOUNT).required()
});
export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).pattern(/^[a-zA-Z0-9_!?@]*$/).required()
});
export const registrationSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).pattern(/^[a-zA-Z0-9_!?@]*$/).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
});

export const makeInferenceSchema = Joi.object({
    modelId: Joi.string().valid(...modelIds).required(),
    modelVersion: Joi.string().valid(...yolov8Versions).required(),
    datasetName: Joi.string().min(VP.MIN_DATASET_NAME_LENGTH).max(VP.MAX_DATASET_NAME_LENGTH).required()
});

export const getJobStatusSchema = Joi.object({
    jobId: Joi.number().integer().required()
});

export const getJobResultSchema = Joi.object({
    jobId: Joi.number().integer().required()
});

export const userSchema = Joi.object({
    userEmail: Joi.string().email().required(),
    userRole: Joi.string().valid(...roles).required()
});


