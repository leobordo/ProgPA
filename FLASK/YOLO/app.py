"""
This module sets up a Flask web application that provides an endpoint for processing prediction 
requests using machine learning models. It is designed to handle both image and video files, 
applying object detection models to analyze the media and generate annotated outputs. The module 
also tracks and logs the environmental impact of the prediction process, including CO2 emissions 
and energy consumption.

Key Components:
- **Environment Configuration**: Loads environment variables required for the application's configuration 
  from a `.env` file using the `dotenv` package.
- **Flask Initialization**: Sets up the Flask application and integrates it with a SQLAlchemy database 
  instance for handling persistent data.
- **Prediction Endpoint**: Defines a `/predict` route that handles POST requests to perform predictions on 
  media files. This endpoint:
  - Validates incoming request parameters to ensure all necessary information is provided and correct.
  - Tracks emissions and energy consumption using the `codecarbon` package during the prediction process.
  - Processes each file in a specified dataset directory, determining whether the file is an image or video, 
    and applying the appropriate model to generate predictions and annotations.
  - Saves annotated media and returns a comprehensive response that includes prediction results, as well as 
    environmental impact metrics.
"""
import os

from dotenv import load_dotenv
from flask import Flask, request, jsonify
from codecarbon import EmissionsTracker

from config import Config, logger
from models import db
from processing import (get_annotated_image, get_annotated_video, 
                        get_image_text_result, get_video_text_result)
from utils import get_file_category
from validation import validate_request_params


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
    logger.debug("Received POST request at /predict.")

    # Use the validation function to verify the request parameters
    validation_response = validate_request_params(request)

    if validation_response['error']:
        return jsonify({'error': validation_response['error']}), validation_response['status_code']

    # Start tracking emissions and energy consumption for the prediction process
    tracker = EmissionsTracker()
    tracker.start()

    # Extract validation values
    job_id = validation_response['job_id']
    model_id = validation_response['model_id']
    model_version = validation_response['model_version']
    dataset_id = validation_response['dataset_id']
    model = validation_response['model']

    logger.debug("Job ID: %s, Model ID: %s, Model Version: %s, Dataset ID: %s"
                 , job_id, model_id, model_version, dataset_id)

    # Define the path to the original images directory for the specified dataset
    directory_path = os.path.join('/user/uploads', str(dataset_id), 'original_files')
    logger.debug("Original images to directory path : %s", directory_path)

    # Check if the directory with original images exists
    if not os.path.exists(directory_path):
        #return jsonify({'error': f'Directory not found: {directory_path}'}), 404
        logger.debug("os.path.exists(directory_path) exist")

    # List to store results
    results_list = []

    # Define the path to save annotated images and videos
    annotated_images_dir = os.path.join('/user/uploads', str(dataset_id), 
                                        'annotated_files', str(job_id))
    
    # Create the annotated images directory if it does not exist
    os.makedirs(annotated_images_dir, exist_ok=True)

    # Process each file in the original images directory
    for file in os.listdir(directory_path):
        file_path = os.path.join(directory_path, file)
        logger.debug("Processing file: %s", file_path)

        # Check if the current path is a file
        if os.path.isfile(file_path):
            logger.debug("File found: %s", file_path)

            # Get the file category (image or video)
            category = get_file_category(file_path)
            logger.debug("File category: %s", category)

            if category == 'image':
                results_list.extend(get_image_text_result(file_path, model))
                get_annotated_image(file_path, model, dataset_id, job_id)

            elif category == 'video':
                video_result = get_video_text_result(file_path, model)
                if video_result and isinstance(video_result, list):
                    results_list.extend(video_result)  
                else:
                    logger.error(f"Failed to process video: {file_path}")
                get_annotated_video(file_path, model, dataset_id, job_id)
   
    tracker.stop()

    emissions_data = tracker.final_emissions_data

    # Compile the results and emissions data into a single response
    results_with_emissions = {
        
        'inference_information': {
            'dataset_id': dataset_id,
            'CO2_emissions_kg': emissions_data.emissions,  
            'consumed_energy_kWh': emissions_data.energy_consumed, 
            'inference_time_s': emissions_data.duration,  
        },
        'inference_results': results_list
    }

    results_json = jsonify(results_with_emissions)
    
    return results_json, 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
