/**
 * @fileOverview Token cost configuration module.
 *
 * This module defines the costs associated with various operations in the application,
 * such as uploading images or videos and performing inferences. It also sets the initial
 * token balance for new users. These constants are used throughout the application to 
 * manage and calculate token consumption.
 */

/**
 * Object containing the token costs for various operations.
 *
 * @constant {Object} TOKEN_COSTS
 * @property {number} IMAGE_UPLOADING - Cost to upload an image and insert it into a dataset.
 * @property {number} FRAME_VIDEO_UPLOADING - Cost to upload a video frame and insert it into a dataset.
 * @property {number} IMAGE_INFERENCE - Cost to perform inference on an image.
 * @property {number} FRAME_VIDEO_INFERENCE - Cost to perform inference on a video frame.
 */
export const TOKEN_COSTS = {
    IMAGE_UPLOADING: 0.75,          
    FRAME_VIDEO_UPLOADING: 0.5,     
    IMAGE_INFERENCE: 1.5,           
    FRAME_VIDEO_INFERENCE: 1.0,     
};

/**
 * The initial number of tokens assigned to a new user.
 *
 * @constant {number} INITIAL_TOKENS
 */
export const INITIAL_TOKENS: number = 1000;  