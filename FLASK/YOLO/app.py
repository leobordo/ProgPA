import os
import logging
import shutil

from flask import Flask, request, jsonify  #, send_file
from dotenv import load_dotenv

#from flask_sqlalchemy import SQLAlchemy
# import yt_dlp
# import torch
# import cv2
# import requests
# from PIL import Image

#from ultralytics.models.yolo.model import YOLO
#from ultralytics.engine.results import Results
from config import Config
from models import db, Dataset, Result #, Utente
from utils import model_dict, get_file_category
from processing import get_image_json, get_video_json, get_annotated_image, get_annotated_video

load_dotenv()

app = Flask(__name__)

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# load configuration from config.py
app.config.from_object(Config)

db.init_app(app)

@app.route('/predict', methods=['POST']) # todo: resolve R0914 (Too many local variables (21/15))
def predict():

    logger.debug("Ricevuta richiesta POST a /predict")

    job_id = request.form.get('job_id')
    logger.debug("Job ID ricevuto: %s", job_id)
    if not job_id:
        return jsonify({'error': 'job_id is required'}), 400

    # model ID and model version from the request
    model_id = request.form.get('model_id')
    model_version = request.form.get('model_version')

    logger.debug("Model ID: %s, Model Version: %s", model_id, model_version)

    if not model_id:
        return jsonify({'error': 'model_id is required'}), 400
    
    if not model_version:
        return jsonify({'error': 'model_version is required'}), 400
    model_category = model_dict.get(model_id) # corresponding model and version from the dictionary
    logger.debug("Model category per ID %s: %s", model_id, model_category)

    if model_category is None:
        return jsonify({'error': 'Invalid model_id'}), 400

    model = model_category.get(model_version)
    logger.debug("Modello caricato: %s", model)

    if model is None:
        return jsonify({'error': 'Invalid model_version'}), 400

    dataset_id = request.form.get('dataset_id') # dataset from database
    logger.debug("Dataset ID ricevuto: %s", dataset_id)

    if not dataset_id:
        return jsonify({'error': 'dataset_id is required'}), 400
    dataset = Dataset.query.get(dataset_id)
    if not dataset:
        return jsonify({'error': 'Dataset not found'}), 404
    
    # Costruisce il percorso alla directory delle immagini utilizzando la variabile globale
    directory_path = os.path.join('/user/uploads', str(dataset_id), 'original_files')
    logger.debug("Percorso directory: %s", directory_path)

    if not os.path.exists(directory_path):
        return jsonify({'error': f'Directory not found: {directory_path}'}), 404
    logger.debug("os.path.exists(directory_path) ESISTE")

    results_list = []

    annotated_images_dir = os.path.join('/user/uploads', str(dataset_id), 'annotated_files', str(job_id))
    # Crea la directory se non esiste
    os.makedirs(annotated_images_dir, exist_ok=True)

    for file in os.listdir(directory_path):
        file_path = os.path.join(directory_path, file)
        logger.debug("Elaborazione file: %s", file_path)

        if os.path.isfile(file_path):  # Assicurarsi che sia un file
            logger.debug("File trovato: %s", file_path)
            
            category = get_file_category(file_path)
            logger.debug("Categoria del file: %s", category)
            
            if category == 'image':
                results_list.extend(get_image_json(file_path, model, logger))
                annotated_image = get_annotated_image(file_path, model, logger)

                if annotated_image:
                    # Nome del file annotato
                    output_filename = f"annotated_{os.path.basename(file_path)}"
                    save_path = os.path.join(annotated_images_dir, output_filename)
                    shutil.move(annotated_image, save_path)  # Sposta il file temporaneo nella directory pubblica

            elif category == 'video':
                results_list.extend(get_video_json(file_path, model, logger))
                get_annotated_video(file_path, model, logger, dataset_id, job_id)

    # Convert to json
    results_json = jsonify(results_list)

    # Gestire i risultati in base al job_id, cercando di aggiornare un risultato esistente
    existing_result = Result.query.filter_by(job_id=job_id).first()

    if existing_result is None:
        new_result = Result(
            job_id=job_id,
            result=results_json.get_data(as_text=True),
            # state='Completed',
            model_id=model_id,
            dataset_id=dataset_id,
            model_version=model_version
        )
        db.session.add(new_result)

    else:
        # Aggiornare i campi del risultato esistente
        existing_result.result = results_json.get_data(as_text=True)
        existing_result.state = 'Completed'
        existing_result.model_id = model_version
        existing_result.dataset_id = dataset_id
        existing_result.model_version = model_version

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to save results: {str(e)}'}), 500

       # Query per verificare il risultato e stamparlo per il debug
    result = Result.query.filter_by(job_id=job_id).first()
    if result:
        logger.debug("Risultato aggiornato per job_id %s: %s", job_id, result)
    else:
        logger.debug("Nessun risultato trovato per job_id %s", job_id)

    return results_json, 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
