
import os
import yt_dlp
import tempfile
from flask import Flask, request, jsonify, send_file
from flask_caching import Cache
import torch
import cv2
import requests
from PIL import Image
import io
from ultralytics.models.yolo.model import YOLO
from ultralytics.engine.results import Results
import hashlib
import logging

app = Flask(__name__)

logging.basicConfig(level=logging.INFO)
logging.info("This is a test log message to verify logging configuration.")

# Configurazione Flask-Caching con Redis
cache = Cache(app, config={
    'CACHE_TYPE': 'redis',
    'CACHE_REDIS_HOST': 'redis',
    'CACHE_REDIS_PORT': 6379,
    'CACHE_DEFAULT_TIMEOUT': 300  # Timeout di 5 minuti
})

# Carica il modello YOLOv8 da un file locale
model_path = './ultralytics/best.pt'
# model = torch.load(model_path)
model = YOLO(model_path)

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    image_file = request.files['image']
    image = Image.open(io.BytesIO(image_file.read()))
    
    # Crea un hash dell'immagine per usarlo come chiave della cache
    image_hash = hashlib.md5(image.tobytes()).hexdigest()
    cache_key = f'predict_{image_hash}'

    # Controlla se il risultato è già nella cache e in caso restituisce 
    cached_result = cache.get(cache_key)
    if cached_result:
        logging.info("Cache hit for key: %s (predict1)", cache_key)
        return jsonify(cached_result)

    # Esegui l'inferenza se il risultato non è in cache
    logging.info("Cache miss for key: %s (predict1)", cache_key)
    results : Results = model.predict(image)
    res = [r.tojson() for r in results]

    # Supponendo che il modello restituisca un tensore con i risultati
    #results_list = results.tolist()

    cache.set(cache_key, res, timeout=300)  # Memorizza nella cache per 5 minuti

    return jsonify(res)

@app.route('/prediction', methods=['POST'])
def predict2():
    
    #image_url = request.form.get('imageUrl')

    # Estrai i dati JSON dal corpo della richiesta
    data = request.get_json()
 
    # Accedi all'URL dell'immagine
    image_url = data.get('imageUrl')

    if not image_url :
        return jsonify({'error': 'No image URL provided'}), 400

    try:
        
        # Scarica l'immagine dall'URL
        response = requests.get(image_url)
        response.raise_for_status()  # Verifica che la richiesta sia andata a buon fine
        
        # Converte l'immagine in un oggetto PIL
        image = Image.open(io.BytesIO(response.content))

        # Crea un hash dell'immagine per usarlo come chiave della cache
        image_hash = hashlib.md5(image.tobytes()).hexdigest()
        cache_key = f'prediction_{image_hash}'

        # Controlla se il risultato è già nella cache
        cached_result = cache.get(cache_key)
        if cached_result:
            logging.info("Cache hit for key: %s (predict2)", cache_key)
            return jsonify(cached_result)

        # Esegui l'inferenza
        logging.info("Cache miss for key: %s (predict2)", cache_key)
        results: Results = model.predict(image)
        
        # Converti i risultati in formato JSON
        res = [r.tojson() for r in results]

        # Salva i risultati nella cache per 5 minuti
        cache.set(cache_key, res, timeout=300)

        print(res)

        return jsonify(res)
    
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Failed to download image: {str(e)}'}), 400

    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

# versione di predict_video senza cache
"""@app.route('/predict_video', methods=['POST'])
def predict_video():
    video_url = request.form.get('videoUrl')

    if not video_url:
        return jsonify({'error': 'No video URL provided'}), 400

    try:

        # Usa yt-dlp per ottenere l'URL del video
        ydl_opts = {'quiet': True, 'format': 'best'}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(video_url, download=False)
            video_url = info_dict.get('url', None)
        
        if not video_url:
            return jsonify({'error': 'Failed to extract video URL'}), 400 # Usa yt-dlp per ottenere l'URL del video
        ydl_opts = {'quiet': True, 'format': 'best'}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(video_url, download=False)
            video_url = info_dict.get('url', None)
        
        if not video_url:
            return jsonify({'error': 'Failed to extract video URL'}), 400

        # Scarica il video dall'URL
        response = requests.get(video_url, stream=True)
        

        # Salva temporaneamente il video
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_video_file:
            for chunk in response.iter_content(chunk_size=8192):
                temp_video_file.write(chunk)
            temp_video_path = temp_video_file.name

        # Carica il video usando OpenCV
        video = cv2.VideoCapture(temp_video_path)

        fps = int(video.get(cv2.CAP_PROP_FPS))  # Frame per secondo del video
        width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))

        # Crea un file video per l'output
        output_video_path = tempfile.mktemp(suffix='.mp4')
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')  # Codifica video
        out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))

        while True:
            ret, frame = video.read()
            if not ret:
                break

            # Esegui l'inferenza su ogni frame
            results: Results = model.predict(frame)

            # Disegna i riquadri di delimitazione sul frame
            for result in results:
                for box in result.boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                    cls = int(box.cls[0].item())
                    conf = box.conf[0].item()
                    label = f"{cls}: {conf:.2f}"
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

            # Scrivi il frame annotato nel video di output
            out.write(frame)

        # Rilascia il video e il file temporaneo
        video.release()
        out.release()
        os.remove(temp_video_path)

        # Restituisci il video annotato come risposta
        return send_file(output_video_path, as_attachment=True, mimetype='video/mp4', download_name='annotated_video.mp4')

    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Failed to download video: {str(e)}'}), 400

    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500"""


# versione di predict_video con cache redis (usare altra tipologia di cache?)
@app.route('/predict_video', methods=['POST'])
def predict_video():
    video_url = request.form.get('videoUrl')

    if not video_url:
        return jsonify({'error': 'No video URL provided'}), 400

    try:

        # Crea un hash dell'URL del video per usarlo come chiave della cache
        url_hash = hashlib.md5(video_url.encode('utf-8')).hexdigest()
        cache_key = f'predict_video_{url_hash}'

        # Controlla se il risultato è già nella cache
        cached_result = cache.get(cache_key)
        if cached_result:
            logging.info("Cache hit for key: %s (predict_video)", cache_key)
            return send_file(
                io.BytesIO(cached_result), 
                mimetype='video/mp4', 
                as_attachment=True, 
                download_name='cached_annotated_video.mp4'
            )

        # Usa yt-dlp per ottenere l'URL del video
        ydl_opts = {'quiet': True, 'format': 'best'}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(video_url, download=False)
            video_url = info_dict.get('url', None)
        
        if not video_url:
            return jsonify({'error': 'Failed to extract video URL'}), 400 # Usa yt-dlp per ottenere l'URL del video
        
        # Scarica il video dall'URL
        response = requests.get(video_url, stream=True)
        

        # Salva temporaneamente il video
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_video_file:
            for chunk in response.iter_content(chunk_size=8192):
                temp_video_file.write(chunk)
            temp_video_path = temp_video_file.name

        # Carica il video usando OpenCV
        video = cv2.VideoCapture(temp_video_path)

        fps = int(video.get(cv2.CAP_PROP_FPS))  # Frame per secondo del video
        width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))

        # Crea un file video per l'output
        output_video_path = tempfile.mktemp(suffix='.mp4')
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')  # Codifica video
        out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))

        while True:
            ret, frame = video.read()
            if not ret:
                break

            # Esegui l'inferenza su ogni frame
            results: Results = model.predict(frame)

            # Disegna i riquadri di delimitazione sul frame
            for result in results:
                for box in result.boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                    cls = int(box.cls[0].item())
                    conf = box.conf[0].item()
                    label = f"{cls}: {conf:.2f}"
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

            # Scrivi il frame annotato nel video di output
            out.write(frame)

        # Rilascia il video e il file temporaneo
        video.release()
        out.release()
        os.remove(temp_video_path)

        # Leggi il video annotato e memorizzalo nella cache
        with open(output_video_path, 'rb') as f:
            video_data = f.read()
            cache.set(cache_key, video_data, timeout=300)  # Memorizza il video nella cache per 5 minuti

        # Restituisci il video annotato come risposta
        return send_file(output_video_path, as_attachment=True, mimetype='video/mp4', download_name='annotated_video.mp4')

    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Failed to download video: {str(e)}'}), 400

    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
