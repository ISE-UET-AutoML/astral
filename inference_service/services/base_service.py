import onnxruntime as ort
import typing as t
import abc
import json
from utils.requests import DeployRequest
from utils.preprocess_data import load_tabular_model, load_multimodal_model
from utils.tasks import SPECIAL_TASKS

from sklearn.metrics import roc_auc_score, f1_score, accuracy_score, precision_score, recall_score

class BaseService():
    __metaclass__ = abc.ABCMeta
    def __init__(self):
        self.mode = "prediction"
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

    def load_model_metadata(self, userEmail: str, projectName: str, runName: str, task_id: str):
        with open(f"./{task_id}/model/metadata.json", "r") as f:
            labels = json.load(f)['labels']
        self.model_metadata = {"class_names": labels}
        return None


    def deploy(self, params, mode="prediction") -> dict:
        userEmail = params["userEmail"]
        projectName = params["projectName"]
        runName = params["runName"]
        task = params["task"]
        task_id = params["task_id"]
        try:
            if task not in SPECIAL_TASKS and mode == "prediction":
                print("Loading model ONNX format")
                self.load_model_and_model_info(userEmail, projectName, runName, task_id)
                self.load_model_metadata(userEmail, projectName, runName, task_id)
            else:
                self.load_special_models(userEmail, projectName, runName, task, task_id)
            self.warmup(task)
        except Exception as e:
            print(e)
            print("Model deploy failed")
            return {"status": "failed", "message": "Model deploy failed"}
        return {"status": "success", "message": "Model deploy successful"}
        
    
    async def check_already_deploy(self, params, mode="prediction") -> dict:
        if hasattr(self, 'ort_sess') and self.mode == mode:
            return {"status": "success", "message": "Model already deployed"}
        else:
            self.deploy(params, mode)
            return {"status": "success", "message": "Model deployed successfully"}
        
    # FIX RELATIVE PATH ERROR
    def load_model_and_model_info(self, userEmail: str, projectName: str, runName: str, task_id: str) -> None:
    
        print("Getting here")
        try:
            self.ort_sess = ort.InferenceSession(f'./{task_id}/model/model.onnx', 
                                                 providers=['AzureExecutionProvider', 'CUDAExecutionProvider', 'CPUExecutionProvider'])
            self.input_names = [in_param.name for in_param in self.ort_sess.get_inputs()]
            print("Model deploy in ONNX format successfully")
            return None
        except Exception as e:
            print(e)
    
    # TIMESERIES AND TABULAR MODELS
    def load_special_models(self, userEmail: str, projectName: str, runName: str, task: str, task_id: str) -> None:
        
        try:
            match(task):
                case "TABULAR_CLASSIFICATION":
                    self.ort_sess = load_tabular_model(userEmail, projectName, runName, task_id)
                    self.input_names = None
                case _:
                    self.ort_sess = load_multimodal_model(userEmail, projectName, runName, task_id)
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

    async def evaluate_test_data(self, data, task=None):
        """evaluate method to get metrics from a dataset"""
        if task == "TABULAR_CLASSIFICATION":
            scores = self.ort_sess.evaluate(data)
        else:
            print("Getting here")
            print("Problem type is: ", self.ort_sess.problem_type)
            print("Label column is: ", self.ort_sess.label)
            predictions = self.ort_sess.predict(data)
            average = "binary" if self.ort_sess.problem_type == "binary" else "macro"

            y_true = data[self.ort_sess.label].to_numpy()
            y_pred = predictions.to_numpy()

            scores = {
                "accuracy": accuracy_score(y_true, y_pred),
                "f1": f1_score(y_true, y_pred, average=average),
                "precision": precision_score(y_true, y_pred, average=average),
                "recall": recall_score(y_true, y_pred, average=average),
            }
            if self.ort_sess.problem_type == "binary":
                scores["roc_auc"] = roc_auc_score(y_true, y_pred)
            
        return scores


