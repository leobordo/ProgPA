import os
import tempfile
import logging
from PIL import Image
from flask import jsonify
import cv2
from ultralytics.engine.results import Results
from ultralytics.models.yolo.model import YOLO


logger = logging.getLogger(__name__)

def get_image_json(file_path, model, logger):
    results_list = []

    try:
        image = Image.open(file_path)
        logger.debug(f"Immagine aperta correttamente: {file_path}")

        results: Results = model.predict(image)
        logger.debug(f"Risultati predizione immagine: {results}")

        if results[0].boxes is None or len(results[0].boxes) == 0:
            results_list.append({
                'type': 'image',
                'filename': file_path.split('/')[-1],
                'objects': ["none"]
            })
        else:
            res = [r.tojson() for r in results]
            results_list.append({'type': 'image', 'filename': file_path.split('/')[-1], 'objects': res})
    except Exception as e:
        results_list.append({'type': 'image', 'filename': file_path.split('/')[-1], 'error': f'Failed to process image: {str(e)}'})

    return results_list

def get_annotated_image(file_path, model, logger):    # todo: inconsistent-return-statements?
    try:
        image = Image.open(file_path)
        logger.debug(f"Immagine aperta correttamente: {file_path}")

        results: Results = model.predict(image)

        if results and results[0].boxes is not None and len(results[0].boxes) > 0:
            annotated_image = results[0].plot()
            logger.debug(f"Annotazione trovata per l'immagine: {file_path}")
            # Convertire l'array NumPy in un'immagine PIL
            annotated_image = Image.fromarray(annotated_image)
        else:
            annotated_image = image
            logger.debug(f"Nessuna annotazione per l'immagine: {file_path}, carica immagine originale")
        # Creare un file temporaneo per salvare l'immagine (annotata o originale)
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        annotated_image.save(temp_file, 'JPEG')
        logger.debug(f"Immagine (annotata o originale) salvata temporaneamente: {temp_file.name}")

        return temp_file.name

    except Exception as e:
        logger.error(f"Failed to process image: {str(e)}")
        return None



def get_video_json(file_path, model, logger):

    results_list = []

    try:
        video = cv2.VideoCapture(file_path)

        if not video.isOpened():
            return jsonify({'error': f'Failed to open video file {file_path}'}), 500

        logger.debug(f"Video aperto correttamente: {file_path}")

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



def get_annotated_video(file_path, model, logger, dataset_id, job_id):

    try:
        # Directory di output desiderata
        annotated_video_dir = os.path.join('/user/uploads', str(dataset_id), 'annotated_files', str(job_id))
        logger.debug(f"Directory di output specificata per il video annotato: {annotated_video_dir}")

        # Crea la directory se non esiste
        os.makedirs(annotated_video_dir, exist_ok=True)
        logger.debug(f"Directory di output (annotated_video_dir): {annotated_video_dir}")

        # Nome del file annotato
        output_filename = f"annotated_{os.path.basename(file_path)}"
        output_path = os.path.join(annotated_video_dir, output_filename)
        logger.debug(f"Percorso previsto per il file annotato (output_path): {output_path}")

        # Esegui l'inferenza utilizzando Ultralytics YOLO e specifica la directory di salvataggio
        model.predict(file_path, save=True, project=annotated_video_dir, name="annotated_video")

        # Verifica se il file è stato salvato correttamente nella directory di output
        if os.path.exists(output_path):
            logger.debug(f"Video annotato salvato in: {output_path}")
        else:
            logger.error(f"Errore nel salvataggio del video annotato in: {output_path}")
            return None

    except Exception as e:
        logger.error(f"Failed to process video {file_path}: {str(e)}")
        return None
    