import os
import mimetypes
from ultralytics.models.yolo.model import YOLO

# Dizionario dei modelli YOLO
model_dict = {
    'YOLO8': {
        'YOLO8s_FSR': YOLO('./YOLO/ultralytics/yolo8s_focalsr.pt'),
        'YOLO8m_FSR': YOLO('./YOLO/ultralytics/yolo8m_focalsr.pt'),
    }    
}

# MIME types accettati
ACCEPTED_MIME_TYPES = {
    'image': ['image/jpeg', 'image/png'],
    'video': ['video/mp4'],
}

def get_file_category(file_path):
    mime = mimetypes.guess_type(file_path)[0]
    if mime:
        for category, types in ACCEPTED_MIME_TYPES.items():
            if mime in types:
                return category
    return None
