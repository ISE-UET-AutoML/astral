from pathlib import Path
import numpy as np
import os
from PIL import Image
import torchvision.transforms as transforms
import requests
from time import time
import pandas as pd
from transformers import ElectraTokenizer
from autogluon.tabular import TabularPredictor
from autogluon.multimodal import MultiModalPredictor
import json
from urllib.parse import urlparse
import uuid

IMAGE_SIZE = 224


# Apply softmax to each row (each sample's logits)
def softmax(logits):
    exp_logits = np.exp(logits)
    return exp_logits / np.sum(exp_logits, axis=1, keepdims=True)


def preprocess_image(data):
    # Preprocessing function
    transform = transforms.Compose(
        [
            transforms.Resize(size=(IMAGE_SIZE, IMAGE_SIZE)),  # Adjust size as needed
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )

    def preprocess_single_image(image_input):
        if isinstance(image_input, str):
            if image_input.startswith("http"):
                img = Image.open(requests.get(image_input, stream=True).raw)
            else:
                img = Image.open(image_input)
        else:
            img = Image.fromarray(image_input, "RGB")
        img = transform(img)
        return img

    start_time = time()
    images = [preprocess_single_image(image_input) for image_input in data]

    print(f"Preprocess time: {time() - start_time}")
    image_tensor = np.stack(images)
    valid_nums = np.array(
        [1] * len(images), dtype=np.int64
    )  # Create the timm_image_image_valid_num tensor

    image_tensor = np.expand_dims(image_tensor, axis=1)
    return image_tensor, valid_nums


# accept either raw text or path to a csv file
# text_col indicates that input is a path
def preprocess_text(text_input, text_col=None):

    if text_col is None:
        text_list = text_input
    else:
        text_df = pd.read_csv(text_input)
        text_list = text_df[text_col].tolist()

    tokenizer = ElectraTokenizer.from_pretrained("google/electra-base-discriminator")
    inputs = tokenizer(
        text_list,
        return_tensors="np",
        padding="max_length",
        max_length=128,
        truncation=True,
    )

    token_ids = inputs["input_ids"]
    segment_ids = inputs["token_type_ids"]
    valid_length = np.sum(token_ids != tokenizer.pad_token_id, axis=1)

    return token_ids, segment_ids, valid_length


def preprocess_tabular(data, excluded_columns=None):
    data.columns = ["data-VAL-" + col for col in data.columns]
    return data

def preprocess_multimodal(data, column_types=None, excluded_columns=None):
    data.columns = [f'data-{column_types[col]}-' + col if col in column_types.keys() else col for col in data.columns]
    print(data.columns)
    return data, data.columns.tolist()


def combine_extra_request_fields(params):
    required_fields = params.dict()
    extra_fields = params.__dict__.get("model_extra", {})
    combined_fields = {**required_fields, **extra_fields}
    return {"params": combined_fields}


def get_image_filename(url):
    parsed_url = urlparse(url)
    return os.path.basename(parsed_url.path)


def load_tabular_model(userEmail, projectName, runName):
    model = TabularPredictor.load(
        f"../tmp/{userEmail}/{projectName}/trained_models/ISE/{runName}"
    )
    return model


def load_multimodal_model(userEmail, projectName, runName):
    model = MultiModalPredictor.load(
        f"../tmp/{userEmail}/{projectName}/trained_models/ISE/{runName}"
    )
    return model


def temp_download_image(url):
    image_path = "tmp/" + uuid.uuid5(uuid.NAMESPACE_DNS, url).hex + ".jpg"
    if os.path.exists(image_path):
        return image_path
    try:
        # Send a GET request to the image URL
        response = requests.get(url)
        # If the request was successful (status code 200)
        if response.status_code == 200:
            # Open the file in binary-write mode and save the image
            with open(image_path, "wb") as f:
                f.write(response.content)
            return image_path
        else:
            print(f"Failed to download image from {url}")
            return None
    except Exception as e:
        print(f"Error downloading image from {url}: {e}")
        return None


def temp_preprocess_fake_model(data: pd.DataFrame):
    data["img_path"] = data["url_thumbnail"].apply(lambda url: temp_download_image(url))
    keep_columns = ["name", "description", "original_brand", "img_path"]
    data = data[keep_columns]
    return data
