import os
import logging
from PIL import Image
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
                'objects': []
            })
        else:
            res = []
            for r in results:
                try:
                    objects = json.loads(r.tojson())
                    res.extend(objects if isinstance(objects, list) else [objects])
                except json.JSONDecodeError as json_error:
                    logger.error(f"JSON decoding failed for {file_path}: {str(json_error)}")
                    continue

            results_list.append({'type': 'image', 'filename': file_path.split('/')[-1], 'objects': res})
    except Exception as e:
        results_list.append({'type': 'image', 'filename': file_path.split('/')[-1], 'error': f'Failed to process image: {str(e)}'})

    return results_list


def get_video_text_result(file_path, model):
    """
    Processes a video file and returns a dictionary with video results,
    where each video is an object containing all frames and detected objects.

    Args:
        file_path (str): Path to the video file.
        model (object): Model used for predictions.

    Returns:
        dict: A dictionary containing results for the video with all frames included.
    """
    video_results = {
        'type': 'video',
        'filename': file_path.split('/')[-1],  
        'frames': []
    }

    try:
        # Open the video file
        video = cv2.VideoCapture(file_path)

        if not video.isOpened():
            logger.error(f"Failed to open video file {file_path}")
            return [{'error': f'Failed to open video file {file_path}'}]  

        logger.debug("Video opened successfully: %s", file_path)

        # Get the frames per second of the video
        fps = video.get(cv2.CAP_PROP_FPS)
        if fps <= 0:
            logger.error(f"Invalid FPS value: {fps} for video file {file_path}")
            return [{'error': f'Invalid FPS value for video file {file_path}'}]  

        frame_number = 0

        while True:
            ret, frame = video.read()
            if not ret:
                break

            time_in_seconds = round(frame_number / fps, 2) if fps > 0 else 0

            # Perform the frame prediction using the model
            try:
                results: Results = model.predict(frame)
                logger.debug("Frame %d prediction results: %s", frame_number, results)
            except Exception as predict_error:
                logger.error(f"Prediction failed for frame {frame_number} of video {file_path}: {str(predict_error)}")
                frame_data = {
                    'frame_number': frame_number,
                    'time': time_in_seconds,
                    'objects': []  
                }
                video_results['frames'].append(frame_data)
                frame_number += 1
                continue  # Skip to the next frame if prediction fails

            # Check if any objects were detected in the frame
            frame_objects = []
            for r in results:
                try:
                    objects = json.loads(r.tojson())
                    if isinstance(objects, list):
                        frame_objects.extend(objects)
                    else:
                        frame_objects.append(objects)
                except json.JSONDecodeError as json_error:
                    logger.error(f"JSON decoding failed for frame {frame_number} of video {file_path}: {str(json_error)}")
                    continue

            frame_data = {
                'frame_number': frame_number,
                'time': time_in_seconds,
                'objects': frame_objects
            }

            video_results['frames'].append(frame_data)
            frame_number += 1

    except Exception as e:
        logger.error(f"Failed to process video {file_path}: {str(e)}")
        return [{'error': f'Failed to process video {file_path}: {str(e)}'}]  

    finally:
        video.release()

    return [video_results]  




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