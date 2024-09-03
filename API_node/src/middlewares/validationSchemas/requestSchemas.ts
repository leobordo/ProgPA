/**
 * @fileOverview This file contains the schemas for validating requests. 
 *               In particular, a scheme is defined for each request. 
 */
import * as Joi from 'joi';
import { ModelId, Yolov8Version } from '../../models/aiModels';
import { Role } from '../../models/request';
import { VALIDATION_PARAMS as VP } from './validationParameters';

// Converting enum to array of values
const roles = Object.values(Role);
const modelIds = Object.values(ModelId);
const yolov8Versions = Object.values(Yolov8Version);

// Validation schema for the route that consent to create a new dataset
export const createDatasetSchema = Joi.object({
    datasetName: Joi.string().min(VP.MIN_DATASET_NAME_LENGTH).max(VP.MAX_DATASET_NAME_LENGTH).required(),
    tags: Joi.string().min(VP.MIN_TAG_LENGTH).max(VP.MAX_TAG_LENGTH).required()
});

// Validation schema for the route that consents to delete an existing dataset
export const deleteDatasetSchema = Joi.object({
    datasetName: Joi.string().min(VP.MIN_DATASET_NAME_LENGTH).max(VP.MAX_DATASET_NAME_LENGTH).required(),
});

// Validation schema for the route that consents to update an existing dataset 
export const updateDatasetSchema = Joi.object({
    datasetName: Joi.string().min(VP.MIN_DATASET_NAME_LENGTH).max(VP.MAX_DATASET_NAME_LENGTH).required(),
    newDatasetName: Joi.string().min(VP.MIN_DATASET_NAME_LENGTH).max(VP.MAX_DATASET_NAME_LENGTH),
    newTags: Joi.string().min(VP.MIN_TAG_LENGTH).max(VP.MAX_TAG_LENGTH)
});

// Validation schema for the route that consents to upload a new content 
export const uploadContentsSchema = Joi.object({
    datasetName: Joi.string().min(VP.MIN_DATASET_NAME_LENGTH).max(VP.MAX_DATASET_NAME_LENGTH).required()
});

// Validation schema for the route that consents to update the token balance of a user
export const tokensTopUpSchema = Joi.object({
    topUpUserEmail: Joi.string().email().required(),
    topUpAmount: Joi.number().min(VP.MIN_TOPUP_AMOUNT).max(VP.MAX_TOPUP_AMOUNT).required()
});

// Validation schema for the route that consents to make inference on a dataset
export const makeInferenceSchema = Joi.object({
    modelId: Joi.string().valid(...modelIds).required(),
    modelVersion: Joi.string().valid(...yolov8Versions).required(),
    datasetName: Joi.string().min(VP.MIN_DATASET_NAME_LENGTH).max(VP.MAX_DATASET_NAME_LENGTH).required()
});

// Validation schema for the route that consents to get the status of a specified job
export const getJobStatusSchema = Joi.object({
    jobId: Joi.number().integer().required()
});

// Validation schema for the route that allows to get result of a specified job
export const getJobResultSchema = Joi.object({
    jobId: Joi.number().integer().required()
});

// Validation scheme that allows a user to register
export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(VP.MIN_PASSWORD_LENGTH).max(VP.MAX_PASSWORD_LENGTH).pattern(/^[a-zA-Z0-9_!?@]*$/).required()
});

// Validation schema for the route that allows a user to log in
export const registrationSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(VP.MIN_PASSWORD_LENGTH).max(VP.MAX_PASSWORD_LENGTH).pattern(/^[a-zA-Z0-9_!?@]*$/).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
});

//Validation schema to verify the user's informations format
export const userSchema = Joi.object({
    userEmail: Joi.string().email(),
    userRole: Joi.string().valid(...roles)
});


