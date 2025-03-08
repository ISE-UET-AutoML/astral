from pydantic import BaseModel
import json
from enum import Enum


class TrainTask(str, Enum):
    IMAGE_CLASSIFICATION = "IMAGE_CLASSIFICATION"
    TEXT_CLASSIFICATION = "TEXT_CLASSIFICATION"
    TABULAR_CLASSIFICATION = "TABULAR_CLASSIFICATION"
    MULTIMODAL_CLASSIFICATION = "MULTIMODAL_CLASSIFICATION"

class Framework(str, Enum):
    AUTOGLUON = "AUTOGLUON"
    H2O = "H2O"
    TPOT = "TPOT"

class DeployInfo(BaseModel):
    task: TrainTask
    task_id: str
    framework: Framework
    model_path: str
    image_column: str
    label_column: str
    text_column: str