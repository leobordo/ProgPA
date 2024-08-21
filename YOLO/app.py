import os
import yt_dlp
import tempfile
from flask import Flask, request, jsonify, send_file
import torch
import cv2
import requests
from PIL import Image
import io
from ultralytics.models.yolo.model import YOLO
from ultralytics.engine.results import Results

app = Flask(__name__)

model_dict = {
    'YOLO8s_FSR': YOLO('./ultralytics/yolo8s_focalsr.pt'),  
    'YOLO8m_FSR': YOLO('./ultralytics/yolo8m_focalsr.pt'),      
}

# Tipi MIME accettati
ACCEPTED_MIME_TYPES = {
    'images': ['image/jpeg', 'image/png'],
    'videos': ['video/mp4', 'video/x-msvideo'],
}


@app.route('/predict', methods=['POST'])
def predict():
    
    # Recupera l'ID del modello dalla richiesta
    model_version = request.form.get('model_version')
    
    if not model_version:
        return jsonify({'error': 'model_version is required'}), 400
    
    # Recupera il modello corrispondente dal dizionario
    model = model_dict.get(model_version)
    if model is None:
        return jsonify({'error': 'Invalid model_version'}), 400
    
    # se non ci sono immagini né video restituisce errore 
    if 'images' not in request.files and 'videos' not in request.files:
        return jsonify({'error': 'No images or videos provided'}), 400

    # inizializzazione lista risultati 
    results_list = []     

    # Gestione delle immagini caricate
    if 'images' in request.files:
        image_files = request.files.getlist('images')
        for image_file in image_files:
            if image_file.mimetype not in ACCEPTED_MIME_TYPES['images']:
                # Salta il file e continua con il prossimo
                results_list.append({'type': 'image', 'filename': image_file.filename, 'error': f'Invalid image type: {image_file.mimetype}'})
                continue

            try:
                image = Image.open(io.BytesIO(image_file.read()))
                results: Results = model.predict(image)

                # Verifica se non ci sono rilevamenti
                if results[0].boxes is None or len(results[0].boxes) == 0:
                    results_list.append({
                        'type': 'image', 
                        'filename': image_file.filename, 
                        'results': ["none"]
                    })
                else:
                    res = [r.tojson() for r in results]
                    results_list.append({'type': 'image', 'filename': image_file.filename, 'results': res})
            except Exception as e:
                results_list.append({'type': 'image', 'filename': image_file.filename, 'error': f'Failed to process image: {str(e)}'})

            

    # Gestione dei video caricati
    if 'videos' in request.files:
        video_files = request.files.getlist('videos')
        for video_file in video_files:
            if video_file.mimetype not in ACCEPTED_MIME_TYPES['videos']:
                # Salta il file e continua con il prossimo
                results_list.append({'type': 'video', 'filename': video_file.filename, 'error': f'Invalid video type: {video_file.mimetype}'})
                continue
            
            try:
                # Salva temporaneamente il video
                with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_video_file:          # se il video non è mp4? gestione dinamica estensione? 
                    temp_video_file.write(video_file.read())
                    temp_video_path = temp_video_file.name

                # Carica il video usando OpenCV
                video = cv2.VideoCapture(temp_video_path)

                if not video.isOpened():
                    return jsonify({'error': f'Failed to open video file {video_file.filename}'}), 500

                # Ottieni il frame rate del video
                fps = video.get(cv2.CAP_PROP_FPS)

                frame_number = 0
                while True:
                    ret, frame = video.read()
                    if not ret:
                        break
                    
                    # Calcola il tempo (in secondi) del frame corrente
                    time_in_seconds = frame_number / fps


                    # Esegui l'inferenza su ogni frame
                    results: Results = model.predict(frame)
                    
                    # Verifica se non ci sono rilevamenti
                    if results[0].boxes is None or len(results[0].boxes) == 0:
                        results_list.append({
                            'type': 'video_frame', 
                            'filename': video_file.filename, 
                            'frame': frame_number,
                            'time': time_in_seconds,
                            'results': ["none"]
                        })
                    else:
                        res = [r.tojson() for r in results]
                        results_list.append({
                            'type': 'video_frame', 
                            'filename': video_file.filename, 
                            'frame': frame_number, 
                            'results': res
                        })
                    frame_number += 1

            except Exception as e:
                return jsonify({'error': f'Failed to process video {video_file.filename}: {str(e)}'}), 500

            finally:
                video.release()
                os.remove(temp_video_path)

    # Restituisci i risultati per tutte le immagini e i video
    return jsonify(results_list)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)