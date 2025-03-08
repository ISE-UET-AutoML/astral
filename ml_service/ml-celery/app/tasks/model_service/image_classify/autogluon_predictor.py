import logging
from pathlib import Path
from typing import Union
from autogluon.multimodal import MultiModalPredictor


class AutogluonPredictor:
    def __init__(self, model_path: Path):
        self.model_path = model_path
        self.predictor: MultiModalPredictor = MultiModalPredictor(
            problem_type = "classification",    
        )
        self._logger = logging.getLogger(__name__)
        self._logger.setLevel(logging.INFO)
        self.load_model()

    def load_model(self):
        try:
            self.predictor = MultiModalPredictor.load(str(self.model_path))
            self._logger.info(f"Model loaded successfully from {self.model_path}")
        except Exception as e:
            self._logger.error(f"Error loading model: {e}")

    def predict(self, data, as_pandas: bool = True) -> Union[dict, None]:
        try:
            predictions = self.predictor.predict(data, as_pandas=as_pandas, realtime=True)
            return predictions
        except Exception as e:
            self._logger.error(f"Error during prediction: {e}")
            return None

    def predict_proba(self, data, as_pandas: bool = True) -> Union[dict, None]:
        try:
            predictions = self.predictor.predict_proba(data, as_pandas=as_pandas)
            return predictions
        except Exception as e:
            self._logger.error(f"Error during prediction: {e}")
            return None

