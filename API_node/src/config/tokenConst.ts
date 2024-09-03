export const TOKEN_COSTS = {
    IMAGE_UPLOADING: 0.75,          //Cost to upload an image and insert it into a dataset              
    FRAME_VIDEO_UPLOADING: 0.5,     //Cost to upload a video and insert it into a dataset
    IMAGE_INFERENCE: 1.5,           //Cost to make inference on an image
    FRAME_VIDEO_INFERENCE: 1.0,     //Cost to make inference on an video
};

export const INITIAL_TOKENS: number = 100;  //Amount of token of a new user