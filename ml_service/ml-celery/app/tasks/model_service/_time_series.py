from cProfile import label
from email.mime import image
import re
import time
from urllib import response
from zipfile import ZipFile
from celery import shared_task
from sympy import false, use
from tqdm import tqdm
from mq_main import redis
from time import perf_counter
import gdown
from .image_classify.autogluon_trainer import AutogluonTrainer
import uuid
from autogluon.timeseries import TimeSeriesPredictor, TimeSeriesDataFrame
import joblib
from settings.config import TEMP_DIR

from utils import get_storage_client
from utils.dataset_utils import (
    find_latest_model,
    split_data,
    create_csv,
    remove_folders_except,
    create_folder,
    download_dataset,
)
from utils.train_utils import find_in_current_dir

import shutil
import os
from pathlib import Path
import pandas as pd


def train(task_id: str, request: dict):
    print("task_id:", task_id)
    print("request:", request)
    print("MultiModal Training request received")
    start = perf_counter()
    request["training_argument"]["ag_fit_args"]["time_limit"] = request["training_time"]
    request["training_argument"]["ag_fit_args"]["presets"] = request["presets"]
    try:
        user_dataset_path = (
            f"{TEMP_DIR}/{request['userEmail']}/{request['projectName']}/dataset/"
        )
        os.makedirs(user_dataset_path, exist_ok=True)
        user_model_path = f"{TEMP_DIR}/{request['userEmail']}/{request['projectName']}/trained_models/{request['runName']}/{task_id}"
        if os.path.exists(user_model_path):
            shutil.rmtree(user_model_path)

        # TODO: download dataset in this function
        user_dataset_path = download_dataset(
            user_dataset_path, True, request, request["dataset_download_method"]
        )

        # get data path
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
        static_feature_path = find_in_current_dir(
            "metadata", user_dataset_path, is_pattern=True, extension=".csv"
        )

        train_path = f"{user_dataset_path}/{train_path}"
        # val_path = None if val_path is None else f"{user_dataset_path}/{val_path}"
        test_path = f"{user_dataset_path}/{test_path}"
        static_feature_path = (
            None
            if static_feature_path is None
            else f"{user_dataset_path}/{static_feature_path}"
        )

        id_col = request["id_col"]
        time_col = request["timestamp_col"]

        train_data = TimeSeriesDataFrame.from_path(
            train_path,
            id_column=id_col,
            timestamp_column=time_col,
            static_features_path=static_feature_path,
        )

        test_data = TimeSeriesDataFrame.from_path(
            test_path, id_column=id_col, timestamp_column=time_col
        )

        presets = request["presets"]
        label = request["label_column"]
        prediction_length = request["prediction_length"]

        # # training job của mình sẽ chạy ở đây
        predictor = TimeSeriesPredictor(
            label=label,
            prediction_length=prediction_length,
            path=user_model_path,
            eval_metric="MASE",
            known_covariates_names=request["known_covariates"],
        )

        predictor.fit(
            train_data=train_data,
            # tuning_data=val_data,
            time_limit=request["training_time"],
            presets=presets,
        )
        print("Training model successfully")

        test_data = pd.read_csv(test_path)
        metrics = predictor.evaluate(test_data)
        leader_board = predictor.leaderboard(test_data)

        print("Evaluation metrics: ", metrics)

        end = perf_counter()

        return {
            "metrics": metrics,
            "leader_board": leader_board.to_csv(),
            "training_evaluation_time": end - start,
            "saved_model_path": user_model_path,
        }

    except Exception as e:
        print(e)
        # raise HTTPException(status_code=500, detail=f"Error in downloading or extracting folder: {str(e)}")
    # finally:
    # if os.path.exists(temp_dataset_path):
    #    os.remove(temp_dataset_path)
    # return {}
