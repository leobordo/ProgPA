import os
import logging
from PIL import Image
from flask import jsonify
import cv2
from ultralytics.engine.results import Results
from config import logger
import json

logger = logging.getLogger(__name__)

def get_image_text_result(file_path, model):
    """
    Processes an image file and returns a list of results with detected objects.

    Args:
        file_path (str): Path to the image file.
        model (object): Model used for predictions.

    Returns:
        str: A JSON formatted string containing results for the image.
    """
    
    results_list = []

    try:
        # Open the image file
        image = Image.open(file_path)
        logger.debug("Image opened successfully: %s", file_path)

        # Perform prediction using the model
        results: Results = model.predict(image)
        logger.debug("Image prediction results: %s", results)

        # Check if any objects were detected in the image
        if results[0].boxes is None or len(results[0].boxes) == 0:
            results_list.append({
                'type': 'image',
                'filename': file_path.split('/')[-1],
                'objects': ["none"]
            })
        else:
            # Convert results to Python objects from JSON strings
            res = [json.loads(r.tojson()) for r in results]
            results_list.append({'type': 'image', 'filename': file_path.split('/')[-1], 'objects': res})
    except Exception as e:
        results_list.append({'type': 'image', 'filename': file_path.split('/')[-1], 'error': f'Failed to process image: {str(e)}'})

    return results_list


def get_video_text_result(file_path, model):
    """
    Processes a video file and returns a list of results with detected objects for each frame.

    Args:
        file_path (str): Path to the video file.
        model (object): Model used for predictions.

    Returns:
        list: A list of dictionaries containing results for each frame of the video.
    """
    results_list = []

    try:
        # Open the video file
        video = cv2.VideoCapture(file_path)

        if not video.isOpened():
            return jsonify({'error': f'Failed to open video file {file_path}'}), 500

        logger.debug("Video opened successfully: %s", file_path)

        # Get the frames per second of the video
        fps = video.get(cv2.CAP_PROP_FPS)
        frame_number = 0

        while True:
            ret, frame = video.read()
            if not ret:
                break

            time_in_seconds = frame_number / fps

            # Perform the frame prediction using the model
            results: Results = model.predict(frame)

            # Check if any objects were detected in the frame, if not write "none"
            if results[0].boxes is None or len(results[0].boxes) == 0:
                results_list.append({
                    'type': 'video_frame', 
                    'filename': file_path, 
                    'frame': frame_number,
                    'time': time_in_seconds,
                    'results': ["none"]
                })
            else:
                # Convert results to JSON format
                res = [json.loads(r.tojson()) for r in results]
                results_list.append({
                    'type': 'video_frame', 
                    'filename': file_path, 
                    'frame': frame_number, 
                    'results': res
                })
            frame_number += 1

    except Exception as e:
        return jsonify({'error': f'Failed to process video {file_path}: {str(e)}'}), 500    

    finally:
        video.release()

    return results_list



def get_annotated_video(file_path, model, dataset_id, job_id):
    """
    Generates an annotated video using the provided model and saves it to the specified directory.

    Args:
        file_path (str): Path to the video file.
        model (object): Model used for predictions.
        dataset_id (str): ID of the dataset.
        job_id (str): ID of the job.

    Returns:
        None
    """
    try:  
        # # Define desired output directory for annotated video
        annotated_video_dir = os.path.join('/user/uploads', str(dataset_id), 'annotated_files', str(job_id))
        logger.debug("Desired output directory for annotated video: %s", annotated_video_dir)

        # Create the directory if it doesn't exist
        os.makedirs(annotated_video_dir, exist_ok=True)
        logger.debug("Directory created for annotated video: %s", annotated_video_dir)

        # Create output filename and path for the annotated video
        output_filename = f"annotated_{os.path.basename(file_path)}"
        output_path = os.path.join(annotated_video_dir, output_filename)
        logger.debug("Expected path for the annotated video (output_path): %s", output_path)

        # Perform inference using Ultralytics YOLO and specify the save directory
        model.predict(file_path, save=True, project=annotated_video_dir, name="annotated_video")

        # Check if the annotated video file was saved successfully 
        if os.path.exists(output_path):
            logger.debug("Annotated video saved at: %s", output_path)
        
        return None

    except Exception as e:
        logger.error("Failed to process video %s: %s", file_path, str(e))
        return None

def get_annotated_image(file_path, model, dataset_id, job_id):  
    """
    Generates an annotated image using the provided model and saves it to the specified directory.

    Args:
        file_path (str): Path to the image file.
        model (object): Model used for predictions.
        dataset_id (str): ID of the dataset.
        job_id (str): ID of the job.

    Returns:
        None
    """
    try:
        # Define desired output directory for annotated image
        annotated_image_dir = os.path.join('/user/uploads', str(dataset_id), 'annotated_files', str(job_id))
        logger.debug("Desired output directory for annotated image: %s", annotated_image_dir)

        # Creates the directory if it doesn't exist
        os.makedirs(annotated_image_dir, exist_ok=True)
        logger.debug("Desired output directory for annotated image: %s", annotated_image_dir)

        

        # Create output filename and path for the annotated image 
        annotated_filename = f"annotated_{os.path.basename(file_path)}"
        output_path = os.path.join(annotated_image_dir, annotated_filename)
        logger.debug("Expected path for the annotated image (output_path): %s", output_path)
        
        # Perform inference using Ultralytics YOLO and specify the save directory
        model.predict(file_path, save=True, project=annotated_image_dir, name=annotated_filename)

        # Check if the annotated image file was saved successfully
        if os.path.exists(output_path):
            logger.debug("Annotated image saved in: %s", output_path)

        return None

    except Exception as e:
        logger.error("Failed to process image: %s", str(e))
        return None