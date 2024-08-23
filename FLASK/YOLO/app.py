import os
import tempfile
import io
import mimetypes

from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import yt_dlp
import torch
import cv2
import requests
from PIL import Image

#from ultralytics.models.yolo.model import YOLO
from ultralytics.engine.results import Results
from config import Config
from models import db, Utente, Dataset, Result
from utils import model_dict, get_file_category

load_dotenv()

app = Flask(__name__)

app.config.from_object(Config)  # Carica la configurazione da config.py

db.init_app(app)

@app.route('/predict', methods=['POST'])
def predict():
    
    # job id from the request 
    job_id = request.form.get('job_id')
    if not job_id:
        return jsonify({'error': 'job_id is required'}), 400

    # model ID and model version from the request
    model_id = request.form.get('model_id')
    model_version = request.form.get('model_version')
    
    if not model_id:
        return jsonify({'error': 'model_id is required'}), 400
    
    if not model_version:
        return jsonify({'error': 'model_version is required'}), 400
    
    # corresponding model and version from the dictionary
    model_category = model_dict.get(model_id)
    if model_category is None:
        return jsonify({'error': 'Invalid model_id'}), 400

    model = model_category.get(model_version)
    if model is None:
        return jsonify({'error': 'Invalid model_version'}), 400

    # dataset from database 
    dataset_id = request.form.get('dataset_id')
    if not dataset_id:
        return jsonify({'error': 'dataset_id is required'}), 400

    dataset = Dataset.query.get(dataset_id)
    if not dataset:
        return jsonify({'error': 'Dataset not found'}), 404
    
    # Costruire il percorso alla directory delle immagini utilizzando la variabile globale
    directory_path = os.path.join(app.config['UPLOADS_BASE_DIR'], str(dataset_id), 'original_files')

    results_list = []

    if not os.path.exists(directory_path):
        return jsonify({'error': f'Directory not found: {directory_path}'}), 404


    
    for file_name in os.listdir(directory_path):
        local_file_path = os.path.join(directory_path, file_name)
        
        if os.path.isfile(local_file_path):  # Assicurarsi che sia un file
            category = get_file_category(local_file_path)  

            if category == 'image':
                try:
                    image = Image.open(local_file_path)
                    results: Results = model.predict(image)

                    if results[0].boxes is None or len(results[0].boxes) == 0:
                        results_list.append({
                            'type': 'image',
                            'filename': local_file_path,
                            'results': ["none"]
                        })
                    else:
                        res = [r.tojson() for r in results]
                        results_list.append({'type': 'image', 'filename': local_file_path, 'results': res})
                except Exception as e:
                    results_list.append({'type': 'image', 'filename': local_file_path, 'error': f'Failed to process image: {str(e)}'})

            elif category == 'video':
                try:
                    video = cv2.VideoCapture(local_file_path)

                    if not video.isOpened():
                        return jsonify({'error': f'Failed to open video file {local_file_path}'}), 500

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
                                'filename': local_file_path, 
                                'frame': frame_number,
                                'time': time_in_seconds,
                                'results': ["none"]
                            })
                        else:
                            res = [r.tojson() for r in results]
                            results_list.append({
                                'type': 'video_frame', 
                                'filename': local_file_path, 
                                'frame': frame_number, 
                                'results': res
                            })
                        frame_number += 1

                except Exception as e:
                    return jsonify({'error': f'Failed to process video {local_file_path}: {str(e)}'}), 500

                finally:
                    video.release()

    # Convert to json 
    results_json = jsonify(results_list) 

    # Gestire i risultati in base al job_id, cercando di aggiornare un risultato esistente
    existing_result = Result.query.filter_by(job_id=job_id).first()

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

    return results_json, 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
