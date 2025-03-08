from curses.ascii import TAB
from email.policy import HTTP
import json
from re import T
from token import NAME
import requests

from dataclasses import dataclass


@dataclass
class ProjectType(object):

    # Regular tasks
    TABULAR_CLASSIFICATION = "TABULAR_CLASSIFICATION"
    IMAGE_CLASSIFICATION = "IMAGE_CLASSIFICATION"
    TEXT_CLASSIFICATION = "TEXT_CLASSIFICATION"

    TABULAR_REGRESSION = "TABULAR_REGRESSION"
    IMAGE_REGRESSION = "IMAGE_REGRESSION"
    TEXT_REGRESSION = "TEXT_REGRESSION"

    MULTIMODAL_CLASSIFICATION = "MULTIMODAL_CLASSIFICATION"
    MULTIMODAL_REGRESSION = "MULTIMODAL_REGRESSION"

    # Special tasks
    OBJECT_DETECTION = "OBJECT_DETECTION"
    IMAGE_SEGMENTATION = "IMAGE_SEGMENTATION"
    NAMED_ENTITY_RECOGNITION = "NAMED_ENTITY_RECOGNITION"


@dataclass
class DataUploadType:
    IMAGE_LABELED_FOLDER: str = "IMAGE_LABELED_FOLDER"
    IMAGE_UNLABELED: str = "IMAGE_UNLABELED"


def fix_api_route(api: str):
    api = f"api/{api}".replace("//", "/").replace("api/api", "api/")
    return api


class LabelStudioClient:
    # TODO : Raise HTTP exeptions
    def __init__(self, host, default_api_key):
        self.host = host
        self.default_api_key = default_api_key

    def get(self, api_key, api):
        try:
            api = fix_api_route(api)
            res = requests.get(
                f"{self.host}/{api}",
                headers={
                    "Authorization": f"Token {api_key}",
                },
            )
            if "application/json" in res.headers.get("Content-Type", ""):
                return res.json()
            return {
                "status": res.status_code,
                "message": f"api /{api} executed successfully",
            }
        except Exception as e:
            print(e)
            return {"error": str(e)}

    def post(self, api_key, api, data):
        try:
            api = fix_api_route(api)
            res = requests.post(
                f"{self.host}/{api}",
                headers={
                    "Authorization": f"Token {api_key}",
                    "Content-Type": "application/json",
                },
                json=data,
            )
            if "application/json" in res.headers.get("Content-Type", ""):
                return res.json()
            return {
                "status": res.status_code,
                "message": f"api /{api} executed successfully",
            }
        except Exception as e:
            print(e)
            return {"error": str(e)}

    def delete(self, api_key, api):
        try:
            api = fix_api_route(api)
            res = requests.delete(
                f"{self.host}/{api}",
                headers={
                    "Authorization": f"Token {api_key}",
                },
            )
            if "application/json" in res.headers.get("Content-Type", ""):
                return res.json()
            return {
                "status": res.status_code,
                "message": f"api /{api} executed successfully",
            }
        except Exception as e:
            print(e)
            return {"error": str(e)}

    def patch(self, api_key, api, data):
        try:
            api = fix_api_route(api)
            res = requests.patch(
                f"{self.host}/{api}",
                headers={
                    "Authorization": f"Token {api_key}",
                    "Content-Type": "application/json",
                },
                json=data,
            )
            if "application/json" in res.headers.get("Content-Type", ""):
                return res.json()
            return {
                "status": res.status_code,
                "message": f"api /{api} executed successfully",
            }
        except Exception as e:
            print(e)
            return {"error": str(e)}

    def update(self, api_key, api, data):
        return self.patch(api_key, api, data)
