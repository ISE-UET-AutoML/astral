from .base_predictor import BasePredictor
from .base import TrainTask, DeployInfo, Framework
import pandas as pd
import torch
import torchvision.models as models
import torchvision.transforms as transforms
from sklearn.metrics import (
    roc_auc_score,
    f1_score,
    precision_score,
    recall_score,
    accuracy_score,
    balanced_accuracy_score,
    matthews_corrcoef,
)
from PIL import Image
import h2o
import glob
import os
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
import logging
import joblib

class H2oPredictor(BasePredictor):
    def __init__(self):
        self.model = None
        self._logger = logging.getLogger(__name__)
        self._logger.setLevel(logging.INFO)
        self.model_extract_features = None
        self.text_vectorizer = None
        h2o.init()

    def load(self, deploy_info):
        try:
            self.model = h2o.load_model(deploy_info.model_path)
        except Exception as e:
            raise Exception(f"Error loading H2O model: {e}")

    def preprocess(self, data, deploy_info) -> pd.DataFrame:
        match(deploy_info.task):
            case TrainTask.IMAGE_CLASSIFICATION:
                df = []
                for _,image_path in data.iterrows():
                    print('Image path: ',image_path[deploy_info.image_column])
                    features_ = self.extract_features(image_path[deploy_info.image_column])  
                    features_ = np.append(features_, image_path[deploy_info.label_column])
                    df.append(features_)
                if deploy_info.label_column == '':
                    column_names = [f'feature_{i}' for i in range(len(features_) - 1)]
                else:
                    column_names = [f'feature_{i}' for i in range(len(features_) - 1)] + [deploy_info.label_column]
                df = pd.DataFrame(df,columns=column_names)
                return df
            case TrainTask.MULTIMODAL_CLASSIFICATION:
                print("Multimodal not implemented for H2O yet")
                raise ValueError("Multimodal not implemented for H2O yet")
            case TrainTask.TEXT_CLASSIFICATION:
                if self.text_vectorizer is None:
                    self.text_vectorizer = TfidfVectorizer(max_features=1000)
                    text_features = self.text_vectorizer.fit_transform(data.drop(columns=[deploy_info.label_column]).values.ravel()).toarray()
                else:
                    if deploy_info.label_column != '':
                        text_features = self.text_vectorizer.transform(data.drop(columns=[deploy_info.label_column]).values.ravel()).toarray()
                    else:
                        text_features = self.text_vectorizer.transform(data.values.ravel()).toarray()
                feature_df = pd.DataFrame(text_features)
                if deploy_info.label_column != '':
                    feature_df[deploy_info.label_column] = data[deploy_info.label_column]
                return feature_df
            case TrainTask.TABULAR_CLASSIFICATION:
                # preprocess the tabular data
                return data

    def predict(self, data, deploy_info):
        try:

            if deploy_info.task == 'IMAGE_CLASSIFICATION':
                data = self.preprocess(data, deploy_info)
                y_pred = self.model.predict(h2o.H2OFrame(data))
                y_pred_df = y_pred.as_data_frame()
                print('Predict result: ',y_pred_df)
            elif deploy_info.task == 'TEXT_CLASSIFICATION':
                last_path = str(deploy_info.model_path).split('/')[-1]
                vectorize_path = str(deploy_info.model_path).replace(last_path, 'text_vectorize.pkl')
                self.text_vectorizer = joblib.load(vectorize_path)
                df = self.preprocess(data, deploy_info)
                y_pred = self.model.predict(h2o.H2OFrame(data))
                y_pred_df = y_pred.as_data_frame()
                print('Predict result: ',y_pred_df)

            y_pred_series = y_pred_df.iloc[:, 0] 
           
            if y_pred_series.dtype == float:  # Nếu là xác suất
                y_pred_encoded = (y_pred_series >= 0.5).astype(int)
            print(y_pred_encoded)
            return y_pred_encoded
        except Exception as e:
            import traceback
            traceback.print_exc()
            self._logger.error(f"An unexpected error occurred during prediction: {e}")
            return None

    def predict_proba(self, data, deploy_info):
        h2o_data = h2o.H2OFrame(data)
        predictions = self.model.predict(h2o_data)
        return predictions.as_data_frame()

    def evaluate(self, data, deploy_info):
        try:
            df = data
            df_features = df.drop(columns=[deploy_info.label_column])
            y_true = df[deploy_info.label_column]
            if y_true.dtype == object:
                le = LabelEncoder()
                y_true_encoded = le.fit_transform(y_true)
            else:
                y_true_encoded = y_true.astype(int)  # Nếu đã là số thì giữ nguyên
            
            test_df_h2o = h2o.H2OFrame(df_features)
            y_pred = self.model.predict(test_df_h2o)

            y_pred_df = y_pred.as_data_frame()  
            y_pred_series = y_pred_df.iloc[:, 0] 
           
            if y_pred_series.dtype == float:  # Nếu là xác suất
                y_pred_encoded = (y_pred_series >= 0.5).astype(int)
            elif y_pred_series.dtype == object:  # Nếu là chuỗi (nhãn phân loại)
                y_pred_encoded = le.transform(y_pred_series)  # Sử dụng cùng LabelEncoder
            else:
                y_pred_encoded = y_pred_series.astype(int)  # Nếu đã là số thì giữ nguyên


     
            test_res = {
                "accuracy": accuracy_score(y_true_encoded, y_pred_encoded),
                "balanced_accuracy": balanced_accuracy_score(y_true_encoded, y_pred_encoded),
                "mcc": matthews_corrcoef(y_true_encoded, y_pred_encoded),
                "f1_score": f1_score(y_true_encoded, y_pred_encoded, average="binary"),
                "precision": precision_score(y_true_encoded, y_pred_encoded, average="binary"),
                "recall": recall_score(y_true_encoded, y_pred_encoded, average="binary"),
            }
            print('Test result: ',test_res)
            return test_res
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            self._logger.error(f"An unexpected error occurred during evaluation: {e}")
            return None

    def postprocess(self, data, deploy_info):
        return data

    def extract_features(self, image_path):
        model = None
        if self.model_extract_features is None:
            model = models.resnet50(pretrained=True)
            model = torch.nn.Sequential(*(list(model.children())[:-1]))  # Remove the last classification layer
            model.eval()
            self.model_extract_features = model
        else:
            model = self.model_extract_features
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        image = Image.open(image_path).convert("RGB")
        image = transform(image).unsqueeze(0)
        
        with torch.no_grad():
            features = model(image).squeeze().numpy()  # Output shape (2048,)
        
        return features
    
    def get_features_from_images(self, folder_image_path: str):
        data = []
        lst_folder_images_object = os.listdir(folder_image_path)
        print('List folder images object: ',lst_folder_images_object)
        for folder in lst_folder_images_object:
            for file in glob.glob(os.path.join(folder_image_path, folder, "*.jpg")):
                features = self.extract_features(file)
                features = np.append(features, folder)
                data.append(features)

        df = pd.DataFrame(data)
        print('Data frame features: ',df)   
        df.to_csv(f'{folder_image_path}/features.csv', index=False)
        return df