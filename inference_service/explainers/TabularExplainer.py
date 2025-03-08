from autogluon.tabular import TabularDataset, TabularPredictor
import pandas as pd
import numpy as np
import sklearn
import shap
import lime
from .BaseExplainer import BaseExplainer

class TabularExplainer(BaseExplainer):
    def __init__(self, method="shap", model=None, class_names=None, num_samples=100, sample_data_path=None):
        super().__init__(model)
        self.method = method
        self.class_names = class_names
        self.num_samples = num_samples
        
        if sample_data_path is not None:
            self.sample_data_without_label = pd.read_csv(sample_data_path)
            self.feature_names = self.sample_data_without_label.columns
        
        if method == "shap":
            print(len(self.sample_data_without_label))
            self.explainer = shap.KernelExplainer(self.predict_proba, self.sample_data_without_label)

    def preprocess(self, instance):
        if isinstance(instance, pd.Series):
            instance = instance.values.reshape(1,-1)
        if not isinstance(instance, pd.DataFrame):
            instance = pd.DataFrame(instance, columns=self.feature_names)
        return instance

    def predict_proba(self, instances):
        instances = self.preprocess(instances)
        preds = self.model.predict_proba(instances)
        return preds
    
    # get top 5 features that have the most impact on the prediction of each class
    # return a dictionary with class names as keys and a list of top 5 features as values
    def postprocess(self, instance, k = 5):
        res = []
        
        for i in range(len(self.class_names)):
            feature_importances = instance[:, i]
            top_k_indices = np.argsort(feature_importances)[-k:][::-1]
            top_k_column_names = [self.feature_names[i] for i in top_k_indices if feature_importances[i] > 0]
            
            res.append({
                "class": self.class_names[i],
                "features": top_k_column_names
            })
        
        return res
    
    def explain(self, instance):
        if self.method == "shap":
            shap_values = self.explainer.shap_values(instance, nsamples=self.num_samples)
            return self.postprocess(shap_values[0])
        
        