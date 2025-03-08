from autogluon.tabular import TabularDataset, TabularPredictor
import pandas as pd
import numpy as np
import sklearn
import shap
import lime
from .BaseExplainer import BaseExplainer

# A masking function takes a binary mask vector as the first argument and
# the model arguments for a single sample after that
# It returns a masked version of the input x, where you can return multiple
# rows to average over a distribution of masking types
def custom_masker(mask, x):
    # in this simple example we just zero out the features we are masking
    return (x * mask).reshape(1, len(x))


class MultiModalExplainer(BaseExplainer):
    def __init__(self, method="shap", model=None, class_names=None, num_samples=100, feature_names=None):
        super().__init__(model)
        self.method = method
        self.class_names = class_names
        self.num_samples = num_samples
        self.feature_names = feature_names
        
        if method == "shap":
            # suboptimal code, but it works
            self.explainer = shap.Explainer(self.predict_proba, custom_masker, feature_names=self.feature_names)

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
            feature_importances = instance[:, i].values
            top_k_indices = np.argsort(feature_importances)[-k:][::-1]
            top_k_column_names = [self.feature_names[i] for i in top_k_indices if feature_importances[i] > 0]
            top_k_values = [round(float(feature_importances[i]), 2) for i in top_k_indices if feature_importances[i] > 0]
            
            res.append({
                "class": str(self.class_names[i]),
                "features": top_k_column_names,
                "values": top_k_values
            })
        
        return res
    
    def explain(self, instance):
        if self.method == "shap":
            shap_values = self.explainer(instance)
            print(shap_values)
            # need to adapt to multiple examples at once
            return self.postprocess(shap_values[0])
        
        