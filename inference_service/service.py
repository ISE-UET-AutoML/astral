from __future__ import annotations

from numpy import ndarray
from pydantic import BaseModel, Field
from typing import List
from PIL import Image as PILImage
import typing as t
import bentoml
from utils.requests import DeployRequest, ImagePredictionRequest, ImageExplainRequest, TextPredictionRequest, TextExplainRequest, BaseRequest, TabularExplainRequest, TabularPredictionRequest, MultiModalPredictionRequest, MultiModalExplainRequest, ImageEvaluateRequest
from utils.preprocess_data import preprocess_image, softmax, preprocess_text, combine_extra_request_fields, preprocess_tabular, preprocess_multimodal, preprocess_online_image
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
from utils.requests import TabularPredictionToCSVRequest

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


    @bentoml.api(route="/deploy", input_spec=DeployRequest)
    async def temp_deploy(self, **params: t.Any) -> dict:
        response = super().deploy(params)

        return response
    
    @bentoml.api()
    def test_res(self, req: ImagePredictionRequest) -> dict:

        print(req)
        return {"status": "success", "task": "image_classification"}

    @bentoml.api(route="/predict", input_spec=ImagePredictionRequest)
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

    @bentoml.api(route="/evaluate", input_spec=ImageEvaluateRequest)
    async def evaluate(self, **params: t.Any) -> dict:
        start_load = perf_counter()
        # FIX THIS
        await self.check_already_deploy(params, mode="evaluation")
        
        try:
            image_df = pd.read_csv(params["image_file_path"])
            image_df = preprocess_online_image(image_df, params["image_col"])
            scores = await self.evaluate_test_data(image_df, params["task"])

            return {
                "status": "success",
                "message": "Evaluation completed",
                "scores": scores,
            }

        except Exception as e:
            print(e)
            print("Prediction failed")
            return {"status": "failed", "message": "Evaluation failed"}

    @bentoml.api(route="/explain", input_spec=ImageExplainRequest)
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
    
    @bentoml.api(route="/evaluate", input_spec=TextPredictionRequest)
    async def evaluate(self, **params: t.Any) -> dict:
        start_load = perf_counter()
        # FIX THIS
        await self.check_already_deploy(params, mode="evaluation")
        
        try:
            text_df = pd.read_csv(params["text_file_path"])
            scores = await self.evaluate_test_data(text_df, params["task"])

            return {
                "status": "success",
                "message": "Evaluation completed",
                "scores": scores,
            }

        except Exception as e:
            print(e)
            print("Prediction failed")
            return {"status": "failed", "message": "Evaluation failed"}
        
    
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

    def predict_proba(self, data, as_prob=True):
        if as_prob:
            predictions = self.ort_sess.predict_proba(data, as_pandas=False, as_multiclass=True)
        else:
            predictions = self.ort_sess.predict(data, as_pandas=True)
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
    
    @bentoml.api(route="/predict_as_csv", input_spec=TabularPredictionToCSVRequest)
    async def predict_csv(self, **params: t.Any) -> dict:
        start_load = perf_counter()
        # FIX THIS
        await self.check_already_deploy(params)

        try:
            data = pd.read_csv(params["tab_file_path"])
            data = preprocess_tabular(data)
            load_time = perf_counter() - start_load
            
            inference_start = perf_counter()
            probas = self.predict_proba(data, as_prob=False).to_frame()
            keep_df = data[params["columns_to_keep"]]

            temp = pd.concat([keep_df, probas], axis=1)
            temp.to_csv(f"./{params['task_id']}/model/predictions.csv", index=False)


            return {
                "status": "success",
                "message": "Prediction as csv completed",
                "load_time": load_time,
                "inference_time": perf_counter() - inference_start,
                "predictions": f"./{params['task_id']}/model/predictions.csv",
            }

        except Exception as e:
            print(e)
            print("Prediction as csv failed")
            return {"status": "failed", "message": "Prediction as csv failed"}

    
    @bentoml.api(route="/evaluate", input_spec=TabularPredictionRequest)
    async def evaluate(self, **params: t.Any) -> dict:
        start_load = perf_counter()
        # FIX THIS
        await self.check_already_deploy(params, mode="evaluation")
        
        print(params)

        try:
            tab_df = pd.read_csv(params["tab_file_path"])
            tab_df = preprocess_tabular(tab_df)
            print("getting here")
            scores = await self.evaluate_test_data(tab_df, params["task"])
            print(scores)
            return {
                "status": "success",
                "message": "Evaluation completed",
                "scores": scores,
            }

        except Exception as e:
            print(e)
            print("Evaluation failed")
            return {"status": "failed", "message": "Evaluation failed"}
        
    

    
    @bentoml.api(route="/explain", input_spec=TabularExplainRequest)
    async def explain(self, **params: t.Any) -> dict:
        
        start_load = perf_counter()
        # FIX THIS
        await self.check_already_deploy(params)
        
        data = pd.read_csv(params["tab_explain_file_path"])
        data = preprocess_tabular(data)
        
        sample_data_path = f"./{params['task_id']}/model/sample_data.csv"
        
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
    
    @bentoml.api(route="/evaluate", input_spec=MultiModalPredictionRequest)
    async def evaluate(self, **params: t.Any) -> dict:
        start_load = perf_counter()
        # FIX THIS
        await self.check_already_deploy(params, mode="evaluation")
        
        try:
            multimodal_df = pd.read_csv(params["tab_file_path"])
            multimodal_df, _ = preprocess_multimodal(multimodal_df, params["column_types"])
            scores = await self.evaluate_test_data(multimodal_df, params["task"])

            return {
                "status": "success",
                "message": "Evaluation completed",
                "scores": scores,
            }

        except Exception as e:
            print(e)
            print("Prediction failed")
            return {"status": "failed", "message": "Evaluation failed"}
        
    


    @bentoml.api(route="/explain", input_spec=MultiModalExplainRequest)
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
    
