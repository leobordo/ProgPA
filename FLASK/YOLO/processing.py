import logging
from ultralytics.engine.results import Results
from PIL import Image
from flask import jsonify
import cv2

logger = logging.getLogger(__name__)

def process_image(file_path, model, logger):
    
    results_list = []

    try:
        image = Image.open(file_path)
        logger.debug(f"Immagine aperta correttamente: {file_path}")

        results: Results = model.predict(image)
        logger.debug(f"Risultati predizione immagine: {results}")

        if results[0].boxes is None or len(results[0].boxes) == 0:
            results_list.append({
                'type': 'image',
                'filename': file_path,
                'results': ["none"]
            })
        else:
            res = [r.tojson() for r in results]
            results_list.append({'type': 'image', 'filename': file_path, 'results': res})
    except Exception as e:
        results_list.append({'type': 'image', 'filename': file_path, 'error': f'Failed to process image: {str(e)}'})

    return results_list



def process_video(file_path, model, logger):
    results_list = []

    try:
        video = cv2.VideoCapture(file_path)

        if not video.isOpened():
            return jsonify({'error': f'Failed to open video file {file_path}'}), 500

        fps = video.get(cv2.CAP_PROP_FPS)
        frame_number = 0
        while True:
            ret, frame = video.read()
            if not ret:
                break

            time_in_seconds = frame_number / fps
            results: Results = model.predict(frame)
        
            if results[0].boxes is None or len(results[0].boxes) == 0:
                results_list.append({
                    'type': 'video_frame', 
                    'filename': file_path, 
                    'frame': frame_number,
                    'time': time_in_seconds,
                    'results': ["none"]
                })
            else:
                res = [r.tojson() for r in results]
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