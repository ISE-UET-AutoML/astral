# settings.py
import os
from os.path import join, dirname
from dotenv import load_dotenv

load_dotenv(join(dirname(__file__), ".env"))

BACKEND_URL = os.environ.get("BACKEND_URL")
FRONTEND_URL = os.environ.get("FRONTEND_URL")
ML_SERVICE_URL = os.environ.get("ML_SERVICE_URL")

INFERENCE_SERVICE_PORT = os.environ.get("INFERENCE_SERVICE_PORT")