from re import M
from pydantic_settings import BaseSettings, SettingsConfigDict
import configparser
from dataclasses import dataclass

from sklearn import base


class Configs(BaseSettings):
    BACKEND_IP: str = "localhost:8760/"
    IMAGE_CLASSIFICATION_TAG: str = "IMAGE_CLASSIFICATION"
    TEXT_CLASSIFICATION_TAG: str = "TEXT_CLASSIFICATION"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


def get_config():
    # print(Configs())
    return Configs()


cfg = configparser.ConfigParser()
cfg.read("./environment.ini")

TEMP_DIR = "./tmp"


# =========================================================================
#                           PROJECT INFORMATION
# =========================================================================
PROJECT = cfg["project"]
PROJECT_NAME = PROJECT["name"]
HOST = PROJECT["host"]
PORT = PROJECT["port"]

# =========================================================================
#                          BACKEND INFORMATION
# =========================================================================
BACKEND = cfg["backend"]
BACKEND_HOST = BACKEND["host"]
BACKEND_ACCESS_TOKEN = BACKEND["ACCESS_TOKEN_SECRET"]
BACKEND_REFRESH_TOKEN = BACKEND["REFRESH_TOKEN_SECRET"]

# =========================================================================
#                          ML SERVICE INFORMATION
# =========================================================================
ML_SERVICE = cfg["ml_service"]
ML_SERVICE_HOST = ML_SERVICE["host"]

# =========================================================================
#                          LABEL STUDIO INFORMATION
# =========================================================================
LABEL_STUDIO = cfg["label_studio"]
LABEL_STUDIO_HOST = LABEL_STUDIO["host"]
# TODO: Multiple users
LABEL_STUDIO_API_KEY = LABEL_STUDIO["api_key"]  # default key, as one user

# from label_studio_sdk._legacy import Client
from utils.LabelStudio import LabelStudioClient
from label_studio_sdk.client import LabelStudio

label_studio_client = LabelStudioClient(
    host=LABEL_STUDIO_HOST, default_api_key=LABEL_STUDIO_API_KEY
)

label_studio_sdk_client = LabelStudio(
    base_url=LABEL_STUDIO_HOST, api_key=LABEL_STUDIO_API_KEY
)


def ls_sdk_user_client(api_key):
    return LabelStudio(
        base_url=LABEL_STUDIO_HOST, api_key=api_key
    )  # for multiple users


# =========================================================================
#                          CONSTANTS
# =========================================================================


@dataclass
class constants:
    data_prefix = "data"  # data prefix for all data attributes, used to remove label studio attributes when exporting
    data_attributes_prefix = {
        "IMG": "image - url of the image",
        "TXT": "text or string",
        "NUM": "number - no need to specify",
        "CAT": "category - no need to specify",
        "VAL": "value - alias for both NUM and CAT, no need to specify",
        "DTM": "datetime - !CURRENTLY NOT SUPPORTED",
        "VID": "video - !CURRENTLY NOT SUPPORTED",
        "AUD": "audio - !CURRENTLY NOT SUPPORTED",
    }
