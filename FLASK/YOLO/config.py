import os
from dotenv import load_dotenv

# Carica le variabili d'ambiente dal file .env
load_dotenv()

class Config:
    # Configurazione unica per l'applicazione
    SQLALCHEMY_DATABASE_URI = f"postgresql://{os.environ.get('POSTGRES_USER')}:" \
                              f"{os.environ.get('POSTGRES_PASSWORD')}@" \
                              f"{os.environ.get('POSTGRES_HOST')}:" \
                              f"{os.environ.get('POSTGRES_PORT')}/" \
                              f"{os.environ.get('POSTGRES_DB')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOADS_BASE_DIR = os.environ.get('UPLOADS_BASE_DIR')
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default_secret_key')  # Cambia in produzione
    DEBUG = True  # Se vuoi abilitare il debug