from email.mime import image
import logging
import re
from zipfile import ZipFile
from celery import shared_task
from sympy import false, use
from tqdm import tqdm
from mq_main import redis
from time import perf_counter
import gdown
from .image_classify.autogluon_trainer import AutogluonTrainer
import uuid
from autogluon.multimodal import MultiModalPredictor
import joblib
from settings.config import TEMP_DIR


from utils.dataset_utils import (
    find_latest_model,
    split_data,
    create_csv,
    remove_folders_except,
    create_folder,
    download_dataset,
    download_dataset,
)
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
        # if os.path.exists(user_dataset_path) == False:
        #     user_dataset_path = download_dataset(
        #         user_dataset_path,
        #         True,
        #         request["dataset_url"],
        #         request["dataset_download_method"],
        #    )
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

        #! temporary, train and val should be split, file name should be changed
        data_dir = Path(user_dataset_path)
        train_path = os.path.join(data_dir, "Annotations", "trainval_cocoformat.json")
        test_path = os.path.join(data_dir, "Annotations", "test_cocoformat.json")

        presets = request["presets"]

        # training job của mình sẽ chạy ở đây
        predictor = MultiModalPredictor(
            problem_type="object_detection",
            sample_data_path=train_path,
            path=user_model_path,
        )
        logging.basicConfig(level=logging.DEBUG)

        print("created predictor")

        predictor.fit(
            train_path,
            time_limit=request["training_time"],
            presets=presets,
            save_path=user_model_path,
        )

        print(predictor.eval_metric)

        print("Training model successfully")

        metrics = predictor.evaluate(test_path)
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


