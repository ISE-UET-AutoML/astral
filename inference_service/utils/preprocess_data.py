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
from concurrent.futures import ThreadPoolExecutor

IMAGE_SIZE = 224


# Apply softmax to each row (each sample's logits)
def softmax(logits):
    exp_logits = np.exp(logits)
    return exp_logits / np.sum(exp_logits, axis=1, keepdims=True)


def preprocess_image(data):
    # Preprocessing function
    transform = transforms.Compose([
        transforms.Resize(size=(IMAGE_SIZE, IMAGE_SIZE)),  # Adjust size as needed
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    def preprocess_single_image(image_input):
        if isinstance(image_input, str):
            if image_input.startswith("http"):
                img = Image.open(requests.get(image_input, stream=True).raw)
            else:
                img = Image.open(image_input)
        else:
            img = Image.fromarray(image_input, 'RGB')
        img = transform(img)
        return img

    start_time = time()
    images = [preprocess_single_image(image_input) for image_input in data]

    print(f"Preprocess time: {time() - start_time}")
    image_tensor = np.stack(images)
    valid_nums = np.array([1] * len(images), dtype=np.int64) # Create the timm_image_image_valid_num tensor
    
    image_tensor = np.expand_dims(image_tensor, axis=1)
    return image_tensor, valid_nums

# csv with image urls -> download images and then change the image url -> path
def preprocess_online_image(df, image_col="image"):
    os.makedirs("/dev/shm", exist_ok=True)

    def download_and_save(url):
        try:
            response = requests.get(url, stream=True, timeout=10)
            response.raise_for_status()  # Raise an error for failed requests
            
            # Extract filename from URL
            filename = os.path.basename(url)
            save_path = f"/dev/shm/{filename}"
            
            # Write file to /dev/shm
            with open(save_path, 'wb') as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)

            return save_path  # Return the saved file path

        except requests.RequestException as e:
            print(f"Failed to download {url}: {e}")
            return None  # Return None in case of failure

    def parallel_download(df, image_col, num_threads=20):
        with ThreadPoolExecutor(max_workers=num_threads) as executor:
            results = list(executor.map(download_and_save, df[image_col]))

        df[image_col] = results
        return df

    df = parallel_download(df, image_col)
    print("Preprocess image urls done!")

    return df


# accept either raw text or path to a csv file
# text_col indicates that input is a path
def preprocess_text(text_input, text_col=None):

    if text_col is None:
        text_list = text_input
    else:
        text_df = pd.read_csv(text_input)
        text_list = text_df[text_col].tolist()

    tokenizer = ElectraTokenizer.from_pretrained('google/electra-base-discriminator')
    inputs = tokenizer(text_list, return_tensors="np", padding="max_length", max_length=128, truncation=True)

    token_ids = inputs['input_ids']
    segment_ids = inputs['token_type_ids']
    valid_length = np.sum(token_ids != tokenizer.pad_token_id, axis=1)

    return token_ids, segment_ids, valid_length
    

def preprocess_tabular(data, excluded_columns=None):
    # data.columns = ['data-VAL-' + col for col in data.columns]
    return data


def download_and_save(url):
    """
    Downloads a file from the given URL and saves it to /dev/shm.
    :param url: File URL
    :return: Saved file path
    """
    try:
        response = requests.get(url, stream=True, timeout=10)
        response.raise_for_status()  # Raise an error for failed requests
        
        # Extract filename from URL
        filename = os.path.basename(url)
        save_path = f"/dev/shm/{filename}"
        
        # Write file to /dev/shm
        with open(save_path, 'wb') as f:
            for chunk in response.iter_content(1024):
                f.write(chunk)

        return save_path  # Return the saved file path

    except requests.RequestException as e:
        print(f"Failed to download {url}: {e}")
        return None  # Return None in case of failure

# Function to apply parallel downloading
def parallel_download(df, image_col, num_threads=20):
    with ThreadPoolExecutor(max_workers=num_threads) as executor:
        results = list(executor.map(download_and_save, df[image_col]))

    df[image_col] = results
    return df


def preprocess_multimodal(data, column_types=None, excluded_columns=None):
    # data.columns = [f'data-{column_types[col]}-' + col if col in column_types.keys() else col for col in data.columns]
    # print(data.columns)
    
    # based on the column types, download the images and save them somewhere then update the path in the dataframe
    
    os.makedirs("/dev/shm", exist_ok=True)

    image_col = None
    for key in column_types:
        if column_types[key] == 'IMG':
            # download the images, save them and update the path in the dataframe
            image_col = key
            break
    
    if image_col is not None:
        data = parallel_download(data, image_col)
    else:
        print("No image column found in the dataset")

    print("Preprocessing multimodal data done!")
    return data, data.columns.tolist()

def combine_extra_request_fields(params):
    required_fields = params.dict()
    extra_fields = params.__dict__.get("model_extra", {})
    combined_fields = {**required_fields, **extra_fields}
    return {"params": combined_fields}


def get_image_filename(url):
    parsed_url = urlparse(url)
    return os.path.basename(parsed_url.path)

def load_tabular_model(userEmail, projectName, runName, taskID):
    model = TabularPredictor.load(f'./{taskID}/model')
    return model

def load_multimodal_model(userEmail, projectName, runName, taskID):
    model = MultiModalPredictor.load(f'./{taskID}/model')
    return model