from flask import jsonify
from models import db, Result
from config import logger

def load_json_results(validation_data, results_json):
    """
    Saves the json results into the database and handles errors.
    """
    job_id = validation_data['job_id']
    model_id = validation_data['model_id']
    dataset_id = validation_data['dataset_id']
    model_version = validation_data['model_version']

    # Check if a result already exists for the given job_id
    existing_result = Result.query.filter_by(job_id=job_id).first()

    if existing_result is not None:
        # If a result for this job_id already exists, return an error
        logger.error('A result for job_id %s already exists.', job_id)
        return jsonify({'error': f'A result for job_id {job_id} already exists.'}), 400

    # If no result exists, create a new result
    new_result = Result(
        job_id=job_id,
        result=results_json.get_data(as_text=True),
        # Temporary fix to avoid NOT NULL constraint of the "state" parameter
        # state='Completed',                                
        model_id=model_id,
        dataset_id=dataset_id,
        model_version=model_version
    )

    # Add the new result to the session
    db.session.add(new_result)

    try:
        # Commit the session to save the result in the database
        db.session.commit()
    except Exception as e:
        # Rollback the session in case of an error
        db.session.rollback()
        logger.error('Failed to save results: %s', str(e))
        return jsonify({'error': f'Failed to save results: {str(e)}'}), 500

    # Temporary function to check if the result was saved correctly;
    # the process requires manual verification in the database
    result_double_check = Result.query.filter_by(job_id=job_id).first()
    if result_double_check:
        logger.debug("Result saved for job_id %s: %s", job_id, result_double_check)
    else:
        logger.debug("No result found for job_id %s", job_id)

    return results_json, 200