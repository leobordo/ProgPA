from flask import jsonify
from models import Dataset
from utils import model_dict
from config import logger

def validate_request_params(request):
    """
    Validates the parameters in the incoming request form. 
    Checks for the presence of required parameters and validates their values.
    
    Args:
        request (Request): The Flask request object containing form data.

    Returns:
        dict: A dictionary containing either validation error details or validated parameters.
    """
    try:

        # Get a json from the request
        data = request.get_json()

        # Retrieve job_id from the request form and check if it's provided
        job_id = data.get('job_id')
        if not job_id:
            return {'error': 'job_id is required', 'status_code': 400}

        # Retrieve model_id from the request form and check if it's provided
        model_id = data.get('model_id')
        if not model_id:
            return {'error': 'model_id is required', 'status_code': 400}

        # Retrieve model_version from the request form and check if it's provided
        model_version = data.get('model_version')
        if not model_version:
            return {'error': 'model_version is required', 'status_code': 400}

        # Retrieve dataset_id from the request form and check if it's provided
        dataset_id = data.get('dataset_id')
        if not dataset_id:
            return {'error': 'dataset_id is required', 'status_code': 400}

        # Check if the dataset with the provided dataset_id exists
        dataset = Dataset.query.get(dataset_id)
        if not dataset:
            return {'error': 'Dataset not found', 'status_code': 404}

        # Check if the provided model_id is valid and retrieve the model category
        model_category = model_dict.get(model_id)
        if model_category is None:
            return {'error':'Invalid model_id', 'status_code': 400}

        # Check if the provided model_version is valid 
        model = model_category.get(model_version)
        if model is None:
            return {'error': 'Invalid model_version', 'status_code': 400}

        # Return the validated parameters if all checks pass
        return {
            'error': None,
            'job_id': job_id,
            'model_id': model_id,
            'model_version': model_version,
            'dataset_id': dataset_id,
            'model': model
    }

    except Exception as e:
        logger.error(f"Unexpected error during validation: {str(e)}")
        return {'error': 'Internal server error', 'status_code': 500}