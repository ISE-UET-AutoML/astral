from autogluon.tabular import TabularDataset, TabularPredictor
import pandas as pd
import numpy as np
import sklearn
import shap
import lime
from .BaseExplainer import BaseExplainer
from transformers import AutoTokenizer
from lime.lime_text import LimeTextExplainer

from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
# Download stopwords if you haven't already
import nltk
import contractions

from utils.preprocess_data import preprocess_text, softmax

class TextExplainer(BaseExplainer):
    def __init__(self, method="shap", model=None, class_names=None):
        super().__init__(model, class_names)
        self.method = method

        if method == "shap":
            self.tokenizer = AutoTokenizer.from_pretrained("distilbert/distilbert-base-uncased")
            self.explainer = shap.Explainer(self.predict_proba, self.tokenizer, output_names=self.class_names)
        
        if method == "lime":
            nltk.download('stopwords')
            nltk.download('punkt')
            # Get the list of stopwords
            self.stop_words = set(stopwords.words('english'))
            self.explainer = LimeTextExplainer(class_names=self.class_names)


    def preprocess(self, instance):
        if self.method == "shap":
            return pd.DataFrame([instance], columns=['sentence'])
        elif self.method == "lime":
            # expand contractions
            instance = contractions.fix(instance)
            
            print(instance)
            # Tokenize the text
            words = word_tokenize(instance)
            
            # Remove stopwords
            filtered_words = [word for word in words if word.lower() not in self.stop_words]
            
            # Join the filtered words back into a string
            return ' '.join(filtered_words)

    def postprocess(self, instance):
        if self.method == "lime":
            res = []
            for i in range(len(self.class_names)):
                words_score = instance.as_list(label=i)
                positive_score_words = [word for word, score in words_score if score > 0][:5]
                res.append({'class': int(self.class_names[i]), 'words': positive_score_words})
            return res
        else:
            return "Method not supported"
        
    def predict_proba(self, instances):
        token_ids, segment_ids, valid_length = preprocess_text(instances)
        _, logits = self.model.run(None, {self.input_names[0]: token_ids, self.input_names[1]: segment_ids, self.input_names[2]: valid_length})
        predictions = softmax(logits)
        return predictions

    def explain(self, instance):
        data = self.preprocess(instance)
        if self.method == "shap":
            shap_values = self.explainer(data['text'][0:1], max_evals=100, batch_size=20)
            return shap.plots.text(shap_values, display=False)
        elif self.method == "lime":
            exp = self.explainer.explain_instance(data, self.predict_proba, num_features=20, num_samples=200, labels=[i for i in range(len(self.class_names))])
            return self.postprocess(exp)
        
        return "Method not supported"