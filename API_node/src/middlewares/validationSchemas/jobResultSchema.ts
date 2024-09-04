/**
 * @fileOverview Joi Schema Definitions for Inference Result Validation.
 *
 * This module defines various Joi schemas for validating the structure and data types of inference results and related information.
 * These schemas ensure that data received from or sent to different parts of the application adheres to expected formats and 
 * contains all necessary information, minimizing errors and inconsistencies.
 */

import Joi from 'joi';
import { ContentType } from './validationParameters';

// Extract the valid content types into an array
const content_types = Object.values(ContentType);

/**
 * Schema for validating the bounding box coordinates.
 *
 * This schema ensures that each bounding box contains the necessary numerical coordinates.
 */
const BoxSchema = Joi.object({
    x1: Joi.number().required(),
    x2: Joi.number().required(),
    y1: Joi.number().required(),
    y2: Joi.number().required(),
});

/**
 * Schema for validating detected objects in an image or frame.
 *
 * This schema ensures that each detected object has a bounding box, class, confidence score, and name.
 */
const ObjectSchema = Joi.object({
    box: BoxSchema.required(),
    class: Joi.number().required(),
    confidence: Joi.number().required(),
    name: Joi.string().required(),
});

/**
 * Schema for validating frame data in video inference results.
 *
 * This schema ensures that each frame has a frame number, a list of detected objects, and a timestamp.
 */
const FrameSchema = Joi.object({
    frame_number: Joi.number().required(),
    objects: Joi.array().items(ObjectSchema).required(),
    time: Joi.number().required(),
});

/**
 * Schema for validating the inference results.
 *
 * This schema ensures that each inference result includes a filename, content type, and either objects or frames data.
 */
const InferenceResultSchema = Joi.object({
    filename: Joi.string().required(),
    type: Joi.string().valid(...content_types).required(),
    objects: Joi.array().items(ObjectSchema).optional(),
    frames: Joi.array().items(FrameSchema).optional(),
}).or('objects', 'frames'); // At least one of 'objects' or 'frames' should be present

/**
 * Schema for validating inference-related metadata.
 *
 * This schema ensures that the metadata associated with an inference, such as CO2 emissions, energy consumption, 
 * dataset ID, and inference time, are correctly provided.
 */
const InferenceInformationSchema = Joi.object({
    CO2_emissions_kg: Joi.number().required(),
    consumed_energy_kWh: Joi.number().required(),
    dataset_id: Joi.number().required(),
    inference_time_s: Joi.number().required(),
});

/**
 * Main schema for validating the entire inference result data structure.
 *
 * This schema ensures that the inference result contains valid inference information and a list of inference results.
 */
export const ResultSchema = Joi.object({
    inference_information: InferenceInformationSchema.required(),
    inference_results: Joi.array().items(InferenceResultSchema).required(),
});

