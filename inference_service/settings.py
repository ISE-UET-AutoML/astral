# settings.py
import os
from os.path import join, dirname
from dotenv import load_dotenv

load_dotenv(join(dirname(__file__), ".env"))

BACKEND_URL = os.environ.get("BACKEND_URL")
FRONTEND_URL = os.environ.get("FRONTEND_URL")
TRAINING_SERVICE_URL = os.environ.get("TRAINING_SERVICE_URL")

INFERENCE_SERVICE_PORT = os.environ.get("INFERENCE_SERVICE_PORT")

TEMP_DIR = "./tmp"