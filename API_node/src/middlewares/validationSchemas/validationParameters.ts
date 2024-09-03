/**
 * @fileOverview In this file are setted the value used in the validation schemas to validate the requests
 */

export const VALIDATION_PARAMS = {
    MIN_DATASET_NAME_LENGTH: 3,   // Maximum length of dataset name      
    MAX_DATASET_NAME_LENGTH: 40,  // Minimum length of dataset name  
    MIN_TOPUP_AMOUNT: 1,          // Minimum token top-up amount
    MAX_TOPUP_AMOUNT: 20000,      // Maximum token top-up amount
    MIN_TAG_LENGTH: 3,            // Minimum length of the tags (total lenght of all tags)
    MAX_TAG_LENGTH: 80,           // Maximum length of the tags (total lenght of all tags)
    MIN_PASSWORD_LENGTH: 6,       // Minimum length of the user password
    MAX_PASSWORD_LENGTH: 25,      // Maximum length of the user password
};

export enum ContentType {
    Image = "image",
    Video = "video"
}