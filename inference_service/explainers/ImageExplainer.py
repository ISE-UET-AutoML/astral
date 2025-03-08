import pandas as pd
import os
import warnings
import numpy as np
from matplotlib.image import imread
import shap
import cv2
from autogluon.multimodal import MultiModalPredictor
from PIL import Image
from lime import lime_image
import matplotlib.pyplot as plt
from skimage.segmentation import mark_boundaries
from .BaseExplainer import BaseExplainer 
from utils.preprocess_data import preprocess_image, softmax, get_image_filename
import onnxruntime as ort
import requests
# supported methods: LIME, SHAP


IMAGE_SIZE = 256

class ImageExplainer(BaseExplainer):
    def __init__(self, method="lime", model=None, num_samples=100, batch_size=50, class_names=None):
        super().__init__(model, class_names)
        self.method = method
        self.num_samples = num_samples
        self.batch_size = batch_size

        if self.method ==  "lime":
            self.explainer = lime_image.LimeImageExplainer()
        elif self.method == "shap":
            # TODO: adapt masker to image input size
            self.masker = shap.maskers.Image("inpaint_telea", (IMAGE_SIZE, IMAGE_SIZE, 3))
            self.explainer = shap.Explainer(self.predict_proba, masker=self.masker, output_names=self.class_names)


    def preprocess(self, instance):
        match(self.method):
            case "lime":
                if instance.startswith("http"):
                    img = Image.open(requests.get(instance, stream=True).raw)
                return np.array(img), get_image_filename(instance)
            case "shap":
                temp_df = pd.DataFrame(columns=["image"])
                temp_df = temp_df._append({"image": instance}, ignore_index=True)
                temp_df['image'] = temp_df['image'].apply(lambda x: cv2.resize(imread(x), (IMAGE_SIZE, IMAGE_SIZE)))
                return np.stack(temp_df['image'].values, axis=0)[0:1], get_image_filename(instance)
            case _:
                warnings.warn("Method not supported")
                return None
    
    def predict_proba(self, instances):
        image_tensor, valid_nums = preprocess_image(instances)
        _, logits = self.model.run(None, {self.input_names[0]: image_tensor, self.input_names[1]: valid_nums})
        return softmax(logits)
        
    


    # store the explanation in the form of an image with mask
    def explain(self, instance, instance_explain_folder):
        # TEMPORARY
        image_input, image_filename = self.preprocess(instance)
        image_explanation = None
        image_explained_path = f"{instance_explain_folder}/{image_filename}"
        
        if self.method == "lime":
            try:
                explanation = self.explainer.explain_instance(image_input, self.predict_proba, hide_color=0, num_samples=self.num_samples, batch_size=self.batch_size)
                temp, mask = explanation.get_image_and_mask(explanation.top_labels[0], positive_only=True, num_features=10, hide_rest=False)

                # Display the explanation
                image_explanation = mark_boundaries(temp, mask, mode="thick")
                plt.imsave(image_explained_path, image_explanation)
            except Exception as e:
                print(e)
                print("Error in explaining image")
        elif self.method == "shap":
            try:
                shap_values = self.explainer(image_input, max_evals=self.num_samples, batch_size=self.batch_size, outputs=shap.Explanation.argsort.flip[:len(self.class_names)])
                shap.image_plot(shap_values, show=False)
                plt.savefig(image_explained_path, format='jpg')
            except Exception as e:
                print(e)
                print("Error in explaining image")

        return image_explained_path
