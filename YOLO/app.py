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
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

db_user = os.environ.get('POSTGRES_USER')
db_password = os.environ.get('POSTGRES_PASSWORD')
db_name = os.environ.get('POSTGRES_DB')
db_host = os.environ.get('POSTGRES_HOST')
db_port = os.environ.get('POSTGRES_PORT')

db_uri = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class Utente(db.Model):
    __tablename__ = 'utenti'

    email = db.Column(db.String(255), primary_key=True)
    tokens = db.Column(db.Integer, default=1000)

    datasets = db.relationship('Dataset', backref='utente', lazy=True)

    def __repr__(self):
        return f'<Utente {self.email}>'

class Dataset(db.Model):
    __tablename__ = 'datasets'

    dataset_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), db.ForeignKey('utenti.email'), nullable=False)
    file_path = db.Column(db.Text, nullable=False)
    token_cost = db.Column(db.Numeric)
    dataset_name = db.Column(db.String, nullable=False)

    results = db.relationship('Result', backref='dataset', lazy=True)

    __table_args__ = (
        db.UniqueConstraint('email', 'dataset_name', name='uq_email_dataset_name'),
        db.UniqueConstraint('file_path', 'email', name='uq_file_path_email'),
        db.UniqueConstraint('dataset_id', 'dataset_name', name='uq_dataset_id_dataset_name'),
    )

    def __repr__(self):
        return f'<Dataset {self.dataset_name} owned by {self.email}>'

class Result(db.Model):
    __tablename__ = 'results'

    job_id = db.Column(db.String, primary_key=True)
    result = db.Column(db.Text)
    state = db.Column(db.String, nullable=False)
    model_id = db.Column(db.String, nullable=False)
    dataset_id = db.Column(db.Integer, db.ForeignKey('datasets.dataset_id'), nullable=False)
    model_version = db.Column(db.String, nullable=False)

    def __repr__(self):
        return f'<Result {self.job_id} for Dataset {self.dataset_id}>'

model_dict = {
    'YOLO8': {
        'YOLO8s_FSR': YOLO('./ultralytics/yolo8s_focalsr.pt'),
        'YOLO8m_FSR': YOLO('./ultralytics/yolo8m_focalsr.pt'),
        
    }    
}

# accepted MIME types
ACCEPTED_MIME_TYPES = {
    'images': ['image/jpeg', 'image/png'],
    'videos': ['video/mp4'],
}

@app.route('/predict', methods=['POST'])
def predict():
    
    # model ID from the request
    model_id = request.form.get('model_id')
    model_version = request.form.get('model_version')
    
    if not model_id:
        return jsonify({'error': 'model_id is required'}), 400
    
    if not model_version:
        return jsonify({'error': 'model_version is required'}), 400
    
    # corresponding model from the dictionary
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
    
    # file list from dataset, assumes paths separated by commas
    file_paths = dataset.file_path.split(',')  
    results_list = []
    
    for file_path in file_paths:
        # checks if the file is remote 
        if file_path.startswith('http://') or file_path.startswith('https://'):
            # download remote file 
            local_file_path = download_file(file_path)
        else:
            # use local file (no download needed)
            local_file_path = file_path

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

        else:
            results_list.append({'type': 'file', 'filename': local_file_path, 'error': 'Unsupported file type'})

    # Convert to json 
    results_json = jsonify(results_list)

    # Save results in result table 
    new_result = Result(
        result=results_json.get_data(as_text=True),
        state='completed',
        job_id=request.form.get('job_id'),  # ASSUMENDO JOB ID NELLA RICHIESTA 
        model_id=model_version,
        dataset_id=dataset_id,
        model_version=model_version
    )

    try:
        db.session.add(new_result)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to save results: {str(e)}'}), 500

    return results_json, 200

def get_file_category(file_path):
    # get the extension
    ext = os.path.splitext(file_path)[1].lower()  
    
    # extension check 
    for category, extensions in ACCEPTED_MIME_TYPES.items():
        if ext in extensions:
            return category
    
    return None

def download_file(url):
    local_filename = os.path.join(tempfile.gettempdir(), os.path.basename(url))
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        with open(local_filename, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
    return local_filename
       
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
