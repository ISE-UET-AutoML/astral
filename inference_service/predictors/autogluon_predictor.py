
from .base_predictor import BasePredictor
from .base import TrainTask, DeployInfo, Framework
from autogluon.tabular import TabularPredictor
from autogluon.multimodal import MultiModalPredictor
import pandas as pd
from utils.preprocess_data import preprocess_online_image

class AutogluonPredictor(BasePredictor):
    def __init__(self):
        self.model = None

    def load(self, deploy_info):
        match(deploy_info.task):
            case TrainTask.TABULAR_CLASSIFICATION:
                try:
                    self.model = TabularPredictor.load(deploy_info.model_path)
                except Exception as e:
                    raise Exception(f"Error loading Autogluon Tabular model: {e}")

            case _:
                try:
                    self.model = MultiModalPredictor.load(deploy_info.model_path)
                except Exception as e:
                    raise Exception(f"Error loading Autogluon MultiModal model: {e}")

    def preprocess(self, data, deploy_info) -> pd.DataFrame:
        match(deploy_info.task):
            case TrainTask.IMAGE_CLASSIFICATION:
                # download and preprocess the images
                data = preprocess_online_image(data, deploy_info.image_column)
                return data
            case TrainTask.MULTIMODAL_CLASSIFICATION:
                # download and preprocess the images + something else
                data = preprocess_online_image(data, deploy_info.image_column)
                return data
            case TrainTask.TEXT_CLASSIFICATION:
                # preprocess the text
                return data
            case TrainTask.TABULAR_CLASSIFICATION:
                # preprocess the tabular data
                return data

    def predict(self, data, deploy_info):
        return self.model.predict(data, as_pandas=False)

    def predict_proba(self, data, deploy_info):
        return self.model.predict_proba(data, as_pandas=False)

    def evaluate(self, data, deploy_info):
        # TODO: handle both classification and regression
        if deploy_info.task == TrainTask.TABULAR_CLASSIFICATION:
            return self.model.evaluate(data)
        else:
            if self.model.problem_type == "binary":
                return self.model.evaluate(data, metrics=["accuracy", "roc_auc", "f1", "precision", "recall"])
            elif self.model.problem_type == "multiclass":
                return self.model.evaluate(data, metrics=["accuracy", "f1_macro", "precision_macro", "recall_macro"])
            else:
                raise ValueError("Regression evaluation not implemented yet")
        return None

    def postprocess(self, data, deploy_info):
        pass