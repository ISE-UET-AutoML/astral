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


class TextExplainer(BaseExplainer):
    def __init__(self, method="shap", model=None, class_names=None):
        super().__init__(model, class_names)
        self.method = method
        self.tokenizer = AutoTokenizer.from_pretrained(
            "distilbert/distilbert-base-uncased"
        )

        if method == "shap":
            self.explainer = shap.Explainer(
                self.predict_proba, self.tokenizer, output_names=self.class_names
            )
            self.tokenizer = AutoTokenizer.from_pretrained(
                "distilbert/distilbert-base-uncased"
            )
            self.explainer = shap.Explainer(
                self.predict_proba, self.tokenizer, output_names=self.class_names
            )

        if method == "lime":
            nltk.download("stopwords")
            nltk.download("punkt")
            nltk.download("punkt_tab")
            # Get the list of stopwords
            self.stop_words = set(stopwords.words("english"))
            self.explainer = LimeTextExplainer(class_names=self.class_names)

    def preprocess(self, instance):
        if self.method == "shap":
            return pd.DataFrame([instance], columns=["sentence"])
        elif self.method == "lime":
            # expand contractions
            instance = contractions.fix(instance)

            print(instance)
            # Tokenize the text
            words = word_tokenize(instance)

            # Remove stopwords
            filtered_words = [
                word for word in words if word.lower() not in self.stop_words
            ]

            # Join the filtered words back into a string
            return " ".join(filtered_words)

    def postprocess(self, instance):
        if self.method == "lime":
            res = []
            for i in range(len(self.class_names)):
                words_score = instance.as_list(label=i)
                print(words_score)
                positive_score_words = [word for word, score in words_score if score > 0][:5]
                res.append({'class': str(self.class_names[i]), 'words': positive_score_words})
            return res
        else:
            return "Method not supported"

    def predict_proba(self, instances):
        sentences = []
        for instance in instances:
            sentences.append(instance)
        return self.model.predict_proba({"text": sentences}, realtime=True)

    def explain(self, instance):
        data = self.preprocess(instance)
        if self.method == "shap":
            shap_values = self.explainer(
                data["text"][0:1], max_evals=100, batch_size=20
            )
            return shap.plots.text(shap_values, display=False)
        elif self.method == "lime":
            exp = self.explainer.explain_instance(
                data,
                self.predict_proba,
                num_features=20,
                num_samples=3000,
                labels=[i for i in range(len(self.class_names))],
            )
            return self.postprocess(exp)

        return "Method not supported"
