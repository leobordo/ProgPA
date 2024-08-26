import os
import logging

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
from processing import process_image, process_video

load_dotenv()

app = Flask(__name__)

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# load configuration from config.py
app.config.from_object(Config)

db.init_app(app)

@app.route('/predict', methods=['POST'])
def predict():
    
    logger.debug("Ricevuta richiesta POST a /predict")

    # job id from the request 
    job_id = request.form.get('job_id')
    logger.debug(f"Job ID ricevuto: {job_id}")
    if not job_id:
        return jsonify({'error': 'job_id is required'}), 400

    # model ID and model version from the request
    model_id = request.form.get('model_id')
    model_version = request.form.get('model_version')

    logger.debug(f"Model ID: {model_id}, Model Version: {model_version}")
    
    if not model_id:
        return jsonify({'error': 'model_id is required'}), 400
    
    if not model_version:
        return jsonify({'error': 'model_version is required'}), 400
    
    # corresponding model and version from the dictionary
    model_category = model_dict.get(model_id)
    logger.debug(f"Model category per ID {model_id}: {model_category}")
    if model_category is None:
        return jsonify({'error': 'Invalid model_id'}), 400

    model = model_category.get(model_version)
    logger.debug(f"Modello caricato: {model}")
    if model is None:
        return jsonify({'error': 'Invalid model_version'}), 400

    # dataset from database 
    dataset_id = request.form.get('dataset_id')
    logger.debug(f"Dataset ID ricevuto: {dataset_id}")
    
    if not dataset_id:
        return jsonify({'error': 'dataset_id is required'}), 400

    dataset = Dataset.query.get(dataset_id)
    
    if not dataset:
        return jsonify({'error': 'Dataset not found'}), 404
    
    # Costruire il percorso alla directory delle immagini utilizzando la variabile globale
    directory_path = os.path.join('/user/uploads', str(dataset_id), 'original_files')
    logger.debug(f"Percorso directory: {directory_path}")

    if not os.path.exists(directory_path):
        return jsonify({'error': f'Directory not found: {directory_path}'}), 404
    else: logger.debug(f"os.path.exists(directory_path) ESISTE")

    results_list = []

    for file in os.listdir(directory_path):
        file_path = os.path.join(directory_path, file)
        logger.debug(f"Elaborazione file: {file_path}")

        if os.path.isfile(file_path):  # Assicurarsi che sia un file
            logger.debug(f"File trovato: {file_path}")
            
            category = get_file_category(file_path)  
            logger.debug(f"Categoria del file: {category}")

            if category == 'image':
                results_list.extend(process_image(file_path, model, logger))
            
            elif category == 'video':
                results_list.extend(process_video(file_path, model, logger))
        
    # Convert to json 
    results_json = jsonify(results_list) 

    # Gestire i risultati in base al job_id, cercando di aggiornare un risultato esistente
    existing_result = Result.query.filter_by(job_id=job_id).first()

    if existing_result is None:
        new_result = Result(
            job_id=job_id,
            result=results_json.get_data(as_text=True),
            state='Completed',
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
        logger.debug(f"Risultato aggiornato per job_id {job_id}: {result.result}")
    else:
        logger.debug(f"Nessun risultato trovato per job_id {job_id}")

    return results_json, 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
