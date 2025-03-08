import onnxruntime as ort
import typing as t
import abc
import json
from utils.requests import DeployRequest
from utils.preprocess_data import load_tabular_model, load_multimodal_model
from utils.tasks import SPECIAL_TASKS

class BaseService():
    __metaclass__ = abc.ABCMeta
    def __init__(self):
        print("Init")

    # each task has its own fake data: images -> list of fake image paths, ....
    def get_fake_data(self, task: str) -> t.Any:
        # if task == "image_classification":
        #     return ["../ml-serving/sample_data/image_classify.jpg"]
        # elif task == "text_classification":
        #     return ["../ml-serving/sample_data/text_classify.txt"]
        # else:
        #     return None
        pass

    def load_model_metadata(self, userEmail: str, projectName: str, runName: str):
        with open(f"../tmp/{userEmail}/{projectName}/trained_models/ISE/{runName}/metadata.json", "r") as f:
            labels = json.load(f)['labels']
        self.model_metadata = {"class_names": labels}
        return None


    def deploy(self, params: DeployRequest) -> dict:
        print(params)
        userEmail = params.userEmail
        projectName = params.projectName
        runName = params.runName
        task = params.task
        try:
            if task not in SPECIAL_TASKS:
                self.load_model_and_model_info(userEmail, projectName, runName)
                self.load_model_metadata(userEmail, projectName, runName)
            else:
                self.load_special_models(userEmail, projectName, runName, task)
            self.warmup(task)
        except Exception as e:
            print(e)
            print("Model deploy failed")
            return {"status": "failed", "message": "Model deploy failed"}
        return {"status": "success", "message": "Model deploy successful"}
        
    
    async def check_already_deploy(self, params: DeployRequest) -> dict:
        if hasattr(self, 'ort_sess'):
            return {"status": "success", "message": "Model already deployed"}
        else:
            await self.deploy(params)
            return {"status": "success", "message": "Model deployed successfully"}
        
    # FIX RELATIVE PATH ERROR
    def load_model_and_model_info(self, userEmail: str, projectName: str, runName: str) -> None:
    
        
        try:
            self.ort_sess = ort.InferenceSession(f'../tmp/{userEmail}/{projectName}/trained_models/ISE/{runName}/model.onnx', 
                                                 providers=['AzureExecutionProvider', 'CUDAExecutionProvider', 'CPUExecutionProvider'])
            self.input_names = [in_param.name for in_param in self.ort_sess.get_inputs()]
            print("Model deploy successfully")
            return None
        except Exception as e:
            print(e)
    
    # TIMESERIES AND TABULAR MODELS
    def load_special_models(self, userEmail: str, projectName: str, runName: str, task: str) -> None:
        
        try:
            match(task):
                case "TABULAR_CLASSIFICATION":
                    self.ort_sess = load_tabular_model(userEmail, projectName, runName)
                    self.input_names = None
                case "MULTIMODAL_CLASSIFICATION":
                    self.ort_sess = load_multimodal_model(userEmail, projectName, runName)
                    self.input_names = None
                                        
            print("Model deploy successfully")
            return None
        except Exception as e:
            print(e)

    # fake data and create requests to warmup the model
    def warmup(self, task):
        # data = self.get_fake_data(task)
        # self.predict_proba(data)
        pass


    @abc.abstractmethod
    async def predict_proba(self, data):
        """method to be implemented by subclasses"""
        return


    @abc.abstractmethod
    async def predict(self):
        """predict method to be implemented by subclasses"""
        return

    @abc.abstractmethod
    async def explain(self):
        """explain method to be implemented by subclasses"""
        return



