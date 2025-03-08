from __future__ import annotations

from numpy import ndarray
from pydantic import BaseModel, Field
from typing import List
from PIL import Image as PILImage
import typing as t
import bentoml
from utils.requests import DeployRequest, ImagePredictionRequest, ImageExplainRequest, TextPredictionRequest, TextExplainRequest, BaseRequest, TabularExplainRequest, TabularPredictionRequest, MultiModalPredictionRequest
from utils.preprocess_data import preprocess_image, softmax, preprocess_text, combine_extra_request_fields, preprocess_tabular, preprocess_multimodal
from time import time
import onnx
import onnxruntime as ort
from explainers.ImageExplainer import ImageExplainer
from explainers.TextExplainer import TextExplainer
from explainers.TabularExplainer import TabularExplainer
from explainers.MultiModalExplainer import MultiModalExplainer
from services.base_service import BaseService
import uuid
from time import perf_counter
import base64
import pandas as pd
import numpy as np
import os

@bentoml.service(
    resources={"cpu": "1", "gpu": 1},
    traffic={"timeout": 500},
    http={
        "cors": {
            "enabled": True,
            "access_control_allow_origins": ["*"],
            "access_control_allow_methods": ["GET", "OPTIONS", "POST", "HEAD", "PUT"],
            "access_control_allow_credentials": True,
            "access_control_allow_headers": ["*"],
            "access_control_allow_origin_regex": "https://.*\.my_org\.com",
            "access_control_max_age": 1200,
            "access_control_expose_headers": ["Content-Length"]
        }
    },
)
class ImageClassifyService(BaseService):
    def __init__(self) -> None:
        super().__init__()

    def predict_proba(self, data):
        image_tensor, valid_nums = data
        _, logits = self.ort_sess.run(None, {self.input_names[0]: image_tensor, self.input_names[1]: valid_nums})
        predictions = softmax(logits)
        print(len(predictions))
        return predictions


    @bentoml.api()
    async def deploy(self, **params: t.Any) -> dict:
        response = super().deploy(params)

        return response
    
    @bentoml.api()
    def test_res(self, req: ImagePredictionRequest) -> dict:

        print(req)
        return {"status": "success", "task": "image_classification"}

    @bentoml.api()
    async def predict(self, **params: t.Any) -> dict:
        
        start_load = perf_counter()
        # FIX THIS
        await self.check_already_deploy(params)
        predictions = []
        
        try:
            data = preprocess_image(params["images"])
            load_time = perf_counter() - start_load
            
            inference_start = perf_counter()
            probas = self.predict_proba(data)
            
            for proba in probas:
                predictions.append(
                {
                    "key": str(uuid.uuid4()),
                    "class": self.model_metadata["class_names"][np.argmax(proba)],
                    "confidence": round(float(max(proba)), 2),
                }
            )
                
        except Exception as e:
            print(e)
            print("Prediction failed")
            return {"status": "failed", "message": "Prediction failed"}

        return {
            "status": "success",
            "message": "Prediction completed",
            "load_time": load_time,
            "inference_time": perf_counter() - inference_start,
            "predictions": predictions,
        }
    
    @bentoml.api()
    async def explain(self, **params: t.Any) -> dict:

        start_load = perf_counter()
        # FIX THIS
        await self.check_already_deploy(params)
        os.makedirs("./tmp", exist_ok=True)

        try:
            explainer = ImageExplainer(params["method"], self.ort_sess, num_samples=100, batch_size=32)
            load_time = perf_counter() - start_load
            
            inference_start = perf_counter()
            image_explained_path = explainer.explain(params["image"], "./tmp")
            inference_time = perf_counter() - inference_start
            
            with open(image_explained_path, "rb") as image_file:
                encoded_image = base64.b64encode(image_file.read()).decode("utf-8")
        except Exception as e:
            print(e)
            print("Prediction failed")
            return {"status": "failed", "message": "Explanation failed"}

        return {
            "status": "success",
            "message": "Explanation completed",
            "load_time": load_time,
            "inference_time": inference_time,
            "explanation": encoded_image,
        }





@bentoml.service(
    resources={"cpu": "1", "gpu": 1},
    traffic={"timeout": 500},
    http={
        "cors": {
            "enabled": True,
            "access_control_allow_origins": ["*"],
            "access_control_allow_methods": ["GET", "OPTIONS", "POST", "HEAD", "PUT"],
            "access_control_allow_credentials": True,
            "access_control_allow_headers": ["*"],
            "access_control_allow_origin_regex": "https://.*\.my_org\.com",
            "access_control_max_age": 1200,
            "access_control_expose_headers": ["Content-Length"]
        }
    },
)
class TextClassifyService(BaseService):
    def __init__(self) -> None:
        super().__init__()

    def predict_proba(self, data):
        token_ids, segment_ids, valid_length = data
        _, logits = self.ort_sess.run(None, {self.input_names[0]: token_ids, self.input_names[1]: segment_ids, self.input_names[2]: valid_length})
        predictions = softmax(logits)
        print(len(predictions))
        return predictions


    @bentoml.api(route="/deploy", input_spec=DeployRequest)
    async def temp_deploy(self, **params: t.Any) -> dict:
        response = super().deploy(params)
        return response
    

    @bentoml.api(route="/predict", input_spec=TextPredictionRequest)
    async def predict(self, **params: t.Any) -> dict:
        
        start_load = perf_counter()
        # FIX THIS
        await self.check_already_deploy(params)
        predictions = []
        try:
            data = preprocess_text(params["text_file_path"], params["text_col"])
            text_df = pd.read_csv(params["text_file_path"])
            load_time = perf_counter() - start_load
            
            inference_start = perf_counter()
            probas = self.predict_proba(data)
            
            for i, proba in enumerate(probas):
                predictions.append(
                    {
                        "sentence": text_df[params["text_col"]].values[i],
                        "class": self.model_metadata["class_names"][np.argmax(proba)],
                        "confidence": round(float(max(proba)), 2),
                    }
                )
        except Exception as e:
            print(e)
            print("Prediction failed")
            return {"status": "failed", "message": "Prediction failed"}

        return {
            "status": "success",
            "message": "Prediction completed",
            "load_time": load_time,
            "inference_time": perf_counter() - inference_start,
            "predictions": predictions,
        }
    
    @bentoml.api(route="/explain", input_spec=TextExplainRequest)
    async def explain(self, **params: t.Any) -> dict:
        
        start_load = perf_counter()
        # FIX THIS
        await self.check_already_deploy(params)
        
        try:
            explainer = TextExplainer(params["method"], self.ort_sess, class_names=self.model_metadata["class_names"])
            load_time = perf_counter() - start_load
            inference_start = perf_counter()
            
            explanations = explainer.explain(params["text"])
            inference_time = perf_counter() - inference_start
            
        except Exception as e:
            print(e)
            print("Prediction failed")
            return {"status": "failed", "message": "Explanation failed"}

        return {
            "status": "success",
            "message": "Explanation completed",
            "load_time": load_time,
            "inference_time": inference_time,
            "explanation": explanations,
        }
    

@bentoml.service(
    resources={"cpu": "1", "gpu": 1},
    traffic={"timeout": 500},
    http={
        "cors": {
            "enabled": True,
            "access_control_allow_origins": ["*"],
            "access_control_allow_methods": ["GET", "OPTIONS", "POST", "HEAD", "PUT"],
            "access_control_allow_credentials": True,
            "access_control_allow_headers": ["*"],
            "access_control_allow_origin_regex": "https://.*\.my_org\.com",
            "access_control_max_age": 1200,
            "access_control_expose_headers": ["Content-Length"]
        }
    },
)
class TabularClassifyService(BaseService):
    def __init__(self) -> None:
        super().__init__()

    def predict_proba(self, data):
        predictions = self.ort_sess.predict_proba(data, as_pandas=False, as_multiclass=True)
        return predictions


    @bentoml.api(route="/deploy", input_spec=DeployRequest)
    async def temp_deploy(self, **params: t.Any) -> dict:
        response = super().deploy(params)
        return response
    

    @bentoml.api(route="/predict", input_spec=TabularPredictionRequest)
    async def predict(self, **params: t.Any) -> dict:
        
        start_load = perf_counter()
        # FIX THIS
        await self.check_already_deploy(params)
        predictions = []
        try:
            data = pd.read_csv(params["tab_file_path"])
            data = preprocess_tabular(data)
            load_time = perf_counter() - start_load
            
            inference_start = perf_counter()
            probas = self.predict_proba(data)
            for i, proba in enumerate(probas):
                predictions.append(
                    {
                        "key": str(uuid.uuid4()),
                        "class": str(self.ort_sess.class_labels[np.argmax(proba)]),
                        "confidence": round(float(max(proba)), 2),
                    }
                )
        except Exception as e:
            print(e)
            print("Prediction failed")
            return {"status": "failed", "message": "Prediction failed"}

        return {
            "status": "success",
            "message": "Prediction completed",
            "load_time": load_time,
            "inference_time": perf_counter() - inference_start,
            "predictions": predictions,
        }
    
    @bentoml.api(route="/explain", input_spec=TabularExplainRequest)
    async def explain(self, **params: t.Any) -> dict:
        
        start_load = perf_counter()
        # FIX THIS
        await self.check_already_deploy(params)
        
        data = pd.read_csv(params["tab_explain_file_path"])
        data = preprocess_tabular(data)
        
        sample_data_path = f"./{params['runName']}/model/sample_data.csv"
        
        try:
            explainer = TabularExplainer(params["method"], self.ort_sess, class_names=self.ort_sess.class_labels, num_samples=100, sample_data_path=sample_data_path)
            load_time = perf_counter() - start_load
            inference_start = perf_counter()
            
            explanations = explainer.explain(data)
            inference_time = perf_counter() - inference_start
            
        except Exception as e:
            print(e)
            print("Prediction failed")
            return {"status": "failed", "message": "Explanation failed"}

        return {
            "status": "success",
            "message": "Explanation completed",
            "load_time": load_time,
            "inference_time": inference_time,
            "explanation": explanations,
        }


@bentoml.service(
    resources={"cpu": "1", "gpu": 1},
    traffic={"timeout": 500},
    http={
        "cors": {
            "enabled": True,
            "access_control_allow_origins": ["*"],
            "access_control_allow_methods": ["GET", "OPTIONS", "POST", "HEAD", "PUT"],
            "access_control_allow_credentials": True,
            "access_control_allow_headers": ["*"],
            "access_control_allow_origin_regex": "https://.*\.my_org\.com",
            "access_control_max_age": 1200,
            "access_control_expose_headers": ["Content-Length"]
        }
    },
)
class MultiModalClassifyService(BaseService):
    def __init__(self) -> None:
        super().__init__()

    def predict_proba(self, data):
        predictions = self.ort_sess.predict_proba(data, as_pandas=False, as_multiclass=True)
        print(type(predictions))
        return predictions


    @bentoml.api(route="/deploy", input_spec=DeployRequest)
    async def temp_deploy(self, **params: t.Any) -> dict:
        response = super().deploy(params)
        return response
    

    @bentoml.api(route="/predict", input_spec=MultiModalPredictionRequest)
    async def predict(self, **params: t.Any) -> dict:
        
        start_load = perf_counter()
        # FIX THIS
        await self.check_already_deploy(params)
        predictions = []
        try:
            data = pd.read_csv(params["tab_file_path"])
            data, _ = preprocess_multimodal(data, params["column_types"])
            load_time = perf_counter() - start_load
            
            inference_start = perf_counter()
            probas = self.predict_proba(data)
            for i, proba in enumerate(probas):
                predictions.append(
                    {
                        "key": str(uuid.uuid4()),
                        "class": str(self.ort_sess.class_labels[np.argmax(proba)]),
                        "confidence": round(float(max(proba)), 2),
                    }
                )
        except Exception as e:
            print(e)
            print("Prediction failed")
            return {"status": "failed", "message": "Prediction failed"}

        return {
            "status": "success",
            "message": "Prediction completed",
            "load_time": load_time,
            "inference_time": perf_counter() - inference_start,
            "predictions": predictions,
        }
    
    @bentoml.api(route="/explain", input_spec=TabularExplainRequest)
    async def explain(self, **params: t.Any) -> dict:
        
        start_load = perf_counter()
        # FIX THIS
        await self.check_already_deploy(params)
        
        data = pd.read_csv(params["tab_explain_file_path"])
        data, feature_names = preprocess_multimodal(data, params["column_types"])
        
        
        try:
            explainer = MultiModalExplainer(params["method"], self.ort_sess, class_names=self.ort_sess.class_labels, num_samples=100, feature_names=feature_names)
            load_time = perf_counter() - start_load
            inference_start = perf_counter()
            
            explanations = explainer.explain(data)
            inference_time = perf_counter() - inference_start
            
        except Exception as e:
            print(e)
            print("Prediction failed")
            return {"status": "failed", "message": "Explanation failed"}

        return {
            "status": "success",
            "message": "Explanation completed",
            "load_time": load_time,
            "inference_time": inference_time,
            "explanation": explanations,
        }
