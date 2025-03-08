from email.mime import image
import logging
import re
from zipfile import ZipFile
from celery import shared_task
from sympy import false, im, use
from tqdm import tqdm
from mq_main import redis
from time import perf_counter
import gdown
from .image_classify.autogluon_trainer import AutogluonTrainer
import uuid
from autogluon.multimodal import MultiModalPredictor
import joblib
from settings.config import TEMP_DIR
import pandas as pd


from utils.dataset_utils import (
    find_latest_model,
    split_data,
    create_csv,
    remove_folders_except,
    create_folder,
    download_dataset,
)
from utils.train_utils import find_in_current_dir
import os
from pathlib import Path
import shutil


def train(task_id: str, request: dict):
    print("task_id:", task_id)
    print("request:", request)
    print("Object Detection Training request received")
    start = perf_counter()
    # request["training_argument"]["ag_fit_args"]["time_limit"] = request["training_time"]
    try:
        user_dataset_path = (
            f"{TEMP_DIR}/{request['userEmail']}/{request['projectName']}/dataset"
        )
        user_model_path = f"{TEMP_DIR}/{request['userEmail']}/{request['projectName']}/trained_models/{request['runName']}/{task_id}"

        if os.path.exists(user_model_path):
            shutil.rmtree(user_model_path)

        print("downloading dataset")
        user_dataset_path = download_dataset(
            user_dataset_path,
            True,
            request,
            request["dataset_download_method"],
        )
        download_end = perf_counter()
        print("Download dataset successfully ", user_dataset_path)

        # find data path
        train_path = find_in_current_dir(
            "train", user_dataset_path, is_pattern=True, extension=".csv"
        )
        val_path = find_in_current_dir(
            "val", user_dataset_path, is_pattern=True, extension=".csv"
        )
        if val_path == train_path:
            val_path = None
        test_path = find_in_current_dir(
            "test", user_dataset_path, is_pattern=True, extension=".csv"
        )
        train_path = f"{user_dataset_path}/{train_path}"
        if val_path is not None:
            val_path = f"{user_dataset_path}/{val_path}"
        test_path = f"{user_dataset_path}/{test_path}"

        presets = request["presets"]

        # expanding image path
        train_data = pd.read_csv(train_path)
        val_data = None
        if val_path is not None:
            val_data = pd.read_csv(val_path)
        test_data = pd.read_csv(test_path)

        for img_col in request["image_cols"]:
            train_data[img_col] = train_data[img_col].apply(
                lambda x: f"{user_dataset_path}/{x}"
            )
            if val_path is not None:
                val_data[img_col] = val_data[img_col].apply(
                    lambda x: f"{user_dataset_path}/{x}"
                )
            test_data[img_col] = test_data[img_col].apply(
                lambda x: f"{user_dataset_path}/{x}"
            )

        print(train_data.head())
        # training job của mình sẽ chạy ở đây
        predictor = MultiModalPredictor(
            problem_type="ner",
            path=user_model_path,
            label=request["label_column"],
            hyperparameters={
                "model.sam.checkpoint_name": "facebook/sam-vit-base",
            },
        )
        logging.basicConfig(level=logging.DEBUG)

        #! for development only
        if presets == "medium_quality":
            train_data = train_data.sample(n=20)
            val_data = val_data.sample(n=10)

        print("created predictor")

        predictor.fit(
            train_data,
            tuning_data=val_data,
            time_limit=request["training_time"],
            column_types={"text_snippet": "text_ner"},
            presets=presets,
            save_path=user_model_path,
        )

        print("Training model successfully")

        metrics = predictor.evaluate(
            test_data, metrics=["overall_recall", "overall_precision", "overall_f1"]
        )
        # print(metrics)
        print("Evaluate model successfully")

        end = perf_counter()
        return {
            "metrics": metrics,
            "training_evaluation_time": end - start,
            "model_download_time": download_end - start,
            "saved_model_path": user_model_path,
        }

    except Exception as e:
        print(e)
        # raise HTTPException(status_code=500, detail=f"Error in downloading or extracting folder: {str(e)}")
    # finally:
    # if os.path.exists(temp_dataset_path):
    #    os.remove(temp_dataset_path)
