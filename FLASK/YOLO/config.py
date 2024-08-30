"""
This module configures the application's settings, including the database connection and other environment-specific parameters.

It uses environment variables to dynamically set configurations for different environments (development, testing, production).

Classes:
    Config: Contains configuration settings for the application.
"""


import os
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Load environment variables from a .env file
logger = logging.getLogger(__name__)

load_dotenv()

class Config:
    """
    A configuration class for setting up the application environment.

    Attributes:
        SQLALCHEMY_DATABASE_URI (str): Database URI for SQLAlchemy, built from environment variables.
        SQLALCHEMY_TRACK_MODIFICATIONS (bool): Disables SQLAlchemy event system to save resources.
        UPLOADS_BASE_DIR (str): The base directory for storing uploaded files, taken from environment variables.
        SECRET_KEY (str): Secret key for the application, used for session management. Defaults to 'default_secret_key'.
        DEBUG (bool): Enables debug mode for the application, set to True for development.
    """
    SQLALCHEMY_DATABASE_URI = f"postgresql://{os.environ.get('POSTGRES_USER')}:" \
                              f"{os.environ.get('POSTGRES_PASSWORD')}@" \
                              f"{os.environ.get('POSTGRES_HOST')}:" \
                              f"{os.environ.get('POSTGRES_PORT')}/" \
                              f"{os.environ.get('POSTGRES_DB')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOADS_BASE_DIR = os.environ.get('UPLOADS_BASE_DIR')
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default_secret_key')  
    DEBUG = True  