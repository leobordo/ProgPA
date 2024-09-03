import Joi from 'joi';
import { ContentType } from './validationParameters';

const content_types = Object.values(ContentType);

const BoxSchema = Joi.object({
    x1: Joi.number().required(),
    x2: Joi.number().required(),
    y1: Joi.number().required(),
    y2: Joi.number().required(),
});

const ObjectSchema = Joi.object({
    box: BoxSchema.required(),
    class: Joi.number().required(),
    confidence: Joi.number().required(),
    name: Joi.string().required(),
});

const FrameSchema = Joi.object({
    frame_number: Joi.number().required(),
    objects: Joi.array().items(ObjectSchema).required(),
    time: Joi.number().required(),
});

const InferenceResultSchema = Joi.object({
    filename: Joi.string().required(),
    type: Joi.string().valid(...content_types).required(),
    objects: Joi.array().items(ObjectSchema).optional(),
    frames: Joi.array().items(FrameSchema).optional(),
}).or('objects', 'frames'); // At least one of 'objects' or 'frames' should be present

const InferenceInformationSchema = Joi.object({
    CO2_emissions_kg: Joi.number().required(),
    consumed_energy_kWh: Joi.number().required(),
    dataset_id: Joi.number().required(),
    inference_time_s: Joi.number().required(),
});

export const ResultSchema = Joi.object({
    inference_information: InferenceInformationSchema.required(),
    inference_results: Joi.array().items(InferenceResultSchema).required(),
});

