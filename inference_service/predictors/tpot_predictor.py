from .base_predictor import BasePredictor
from .base import TrainTask, DeployInfo, Framework
import pandas as pd
import torch
import logging
from sklearn.metrics import (
    roc_auc_score,
    f1_score,
    precision_score,
    recall_score,
    accuracy_score,
    balanced_accuracy_score,
    matthews_corrcoef,
)

from sklearn.preprocessing import LabelEncoder

import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score, matthews_corrcoef
import torch
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image


class TpotPredictor(BasePredictor):
    def __init__(self):
        self.model = None
        self._logger = logging.getLogger(__name__)
        self._logger.setLevel(logging.INFO)

        self.image_model = models.resnet50(pretrained=True)
        self.image_model = torch.nn.Sequential(*(list(self.image_model.children())[:-1]))  
        self.image_model.eval()

        self.text_vectorizer = TfidfVectorizer(max_features=1000) 

    def load(self, deploy_info):
        try:
            self.model = joblib.load(deploy_info.model_path)
        except Exception as e:
            raise Exception(f"Error loading TPOT model: {e}")


    def preprocess(self, data, deploy_info) -> pd.DataFrame:
        """Xử lý dataset thành dạng tabular để TPOT có thể sử dụng."""

        match(deploy_info.task):
            case "IMAGE_CLASSIFICATION":
                feature_list = []
                for _, row in data.iterrows():
                    features = self.extract_image_features(row[deploy_info.image_column])
                    if deploy_info.label_column:
                        features = np.append(features, row[deploy_info.label_column])
                    feature_list.append(features)
                if deploy_info.label_column: # ????????
                    column_names = [f'feature_{i}' for i in range(len(features) - 1)] + [deploy_info.label_column]
                else:
                    column_names = [f'feature_{i}' for i in range(len(features) - 1)]
                feature_df = pd.DataFrame(feature_list,columns=column_names)
            case "TEXT_CLASSIFICATION":
                text_features = self.text_vectorizer.fit_transform(data.drop(columns=[deploy_info.label_column])).toarray()
                feature_df = pd.DataFrame(text_features)
                feature_df[deploy_info.label_column] = data[deploy_info.label_column]
            case "MULTIMODAL_CLASSIFICATION":
                image_features = []
                for _, row in data.iterrows():
                    img_feat = self.extract_image_features(row[deploy_info.image_column])
                    image_features.append(img_feat)

                text_features = self.text_vectorizer.fit_transform(data[deploy_info.text_column]).toarray()
                image_df = pd.DataFrame(image_features)
                text_df = pd.DataFrame(text_features)
                other_df = data.drop(columns=[deploy_info.image_column, deploy_info.text_column])
                feature_df = pd.concat([image_df, text_df, other_df], axis=1)
                feature_df[deploy_info.label_column] = data[deploy_info.label_column]
            case "TABULAR_CLASSIFICATION":
                feature_df = data.copy()
                categorical_columns = feature_df.select_dtypes(include=["object"]).columns
                label_encoders = {}
                for col in categorical_columns:
                    le = LabelEncoder()
                    feature_df[col] = le.fit_transform(feature_df[col])
                    label_encoders[col] = le
            case _:
                print(f"TPOT not support this {deploy_info.task} task")
                raise ValueError(f"TPOT not support this {deploy_info.task} task")
        return feature_df

    def predict(self, data, deploy_info):
        try:
            
            processed_data = self.preprocess(data, deploy_info)
            
            y_pred = self.model.predict(processed_data)
            return y_pred
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            return None

    def predict_proba(self, data, deploy_info):
        pass

    def evaluate(self, data, deploy_info):
        try:
            
            X_test = data.drop(columns=[deploy_info.label_column])
            y_test = data[deploy_info.label_column]
            encoder = LabelEncoder()
            y_test_encoded = encoder.fit_transform(y_test)  # Chuyển nhãn chuỗi thành số

            y_pred = self.model.predict(X_test)
            print('Y_pred: ',y_pred)
            print('Y_test: ',y_test)
            print('Type y_pred: ',type(y_pred))
            print('Type y_test: ',type(y_test))

            # Chuyển y_pred về số theo thứ tự của `encoder`
            y_pred_encoded = encoder.transform(y_pred)  # Chuyển đổi nhãn y_pred về số tương ứng

            y_test = y_test_encoded
            y_pred = y_pred_encoded
            test_res = {
                "accuracy": accuracy_score(y_test, y_pred),
                "f1_score": f1_score(y_test, y_pred, average="weighted"),
                "precision": precision_score(y_test, y_pred, average="weighted"),
                "recall": recall_score(y_test, y_pred, average="weighted"),
                "mcc": matthews_corrcoef(y_test, y_pred),
            }
            print('Test_res: ',test_res)
            return test_res

        except Exception as e:
            import traceback
            traceback.print_exc()
            self._logger.error(f"An unexpected error occurred: {e}")
            return None

    def postprocess(self, data, deploy_info):
        pass


    def extract_image_features(self, image_path):
        """Trích xuất feature vector từ ảnh."""
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        image = Image.open(image_path).convert("RGB")
        image = transform(image).unsqueeze(0)

        with torch.no_grad():
            features = self.image_model(image).squeeze().numpy()

        return features
    