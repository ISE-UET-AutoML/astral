from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional, Any
import pandas as pd

from .base import DeployInfo

class BasePredictor(ABC):
    """General Interface for all predictors"""

    @abstractmethod
    def load(self, deploy_info: DeployInfo) -> Any:
        """load model method implemented by all predictors"""
        pass

    @abstractmethod
    def preprocess(self, data: pd.DataFrame, deploy_info: DeployInfo) -> Any:
        """preprocess data method based on frameworks implemented by all predictors"""
        pass

    @abstractmethod
    def predict(self, data, deploy_info: DeployInfo) -> Any:
        """predict and return the class(or values) method implemented by all predictors"""
        pass

    @abstractmethod
    def predict_proba(self, data, deploy_info: DeployInfo) -> Any:
        """predict and return probabilites method implemented by all predictors"""
        pass

    @abstractmethod
    def evaluate(self, data: pd.DataFrame, deploy_info: DeployInfo) -> dict:
        """evaluate method implemented by all predictors"""
        pass

    @abstractmethod
    def postprocess(self, data: pd.DataFrame, deploy_info: DeployInfo) -> dict:
        """evaluate method implemented by all predictors"""
        pass