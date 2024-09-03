"""
Flask application module to handle prediction requests and save results.
"""
import os

from dotenv import load_dotenv
from flask import Flask, request, jsonify

from config import Config, logger
from models import db
from processing import (get_annotated_image, get_annotated_video, 
                        get_image_text_result, get_video_text_result)
from utils import get_file_category
from validation import validate_request_params

import json

# Load environment variables from .env file
load_dotenv()

# Initialize the Flask application
app = Flask(__name__)

# Load configuration from Config class
app.config.from_object(Config)

# Initialize the database with the Flask app
db.init_app(app)

@app.route('/predict', methods=['POST'])
def predict():
    """
    Handles the POST request for predictions. Validates parameters, 
    generates, save and load results.
    """
    logger.debug("Received POST request at /predict")

    # Use the validation function to verify the request parameters
    validation_response = validate_request_params(request)

    if validation_response['error']:
        return validation_response['error'], validation_response['status_code']

    # Extract validation values
    job_id = validation_response['job_id']
    model_id = validation_response['model_id']
    model_version = validation_response['model_version']
    dataset_id = validation_response['dataset_id']
    model = validation_response['model']

    logger.debug("Job ID: %s, Model ID: %s, Model Version: %s, Dataset ID: %s"
                 , job_id, model_id, model_version, dataset_id)

    # Build the path to the original images directory
    directory_path = os.path.join('/user/uploads', str(dataset_id), 'original_files')
    logger.debug("Original images to directory path : %s", directory_path)

    # Check if the original images directory exists
    if not os.path.exists(directory_path):
        #return jsonify({'error': f'Directory not found: {directory_path}'}), 404
        logger.debug("os.path.exists(directory_path) exist")

    results_list = []

    annotated_images_dir = os.path.join('/user/uploads', str(dataset_id), 
                                        'annotated_files', str(job_id))
    # Create the original images directory if it does not exist
    os.makedirs(annotated_images_dir, exist_ok=True)

    # Process each file in the original images directory
    for file in os.listdir(directory_path):
        file_path = os.path.join(directory_path, file)
        logger.debug("Processing file: %s", file_path)

        if os.path.isfile(file_path):
            logger.debug("File found: %s", file_path)

            # Get the file category (image or video)
            category = get_file_category(file_path)
            logger.debug("File category: %s", category)

            if category == 'image':
                results_list.extend(get_image_text_result(file_path, model))
                get_annotated_image(file_path, model, dataset_id, job_id)

            elif category == 'video':
                results_list.extend(get_video_text_result(file_path, model))
                get_annotated_video(file_path, model, dataset_id, job_id)

    # Convert to json
    results_json = json.dumps(results_list, indent=4)  # Format JSON with indentation

    #load_json_results(validation_response, results_json)):
    
    return results_json, 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
