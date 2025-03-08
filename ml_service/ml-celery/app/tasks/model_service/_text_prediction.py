from time import perf_counter
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
    download_dataset2,
)
from utils.train_utils import find_in_current_dir
import os
from pathlib import Path
import pandas as pd
import json


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

        # TODO: download dataset in this function
        train_df = download_dataset2(
            user_dataset_path,
            request["dataset_url"],
            request["dataset_download_method"],
        )
        # train_df, test_df = train_test_split(train_df, test_size=0.2)

        presets = request["presets"]

        # # training job của mình sẽ chạy ở đây
        predictor = MultiModalPredictor(
            label=request["label_column"],
            problem_type=request["problem_type"],
            path=user_model_path,
        )

        predictor.fit(
            train_data=train_df,
            # tuning_data=val_data,
            time_limit=request["training_time"],
            presets=presets,
            save_path=user_model_path,
            hyperparameters=request["training_argument"]["ag_fit_args"][
                "hyperparameters"
            ],
        )

        # metrics = predictor.evaluate(test_data, metrics=request["metrics"])
        # print("Training model successfully")
        exported_path = predictor.export_onnx(data=train_df[0:1], path=str(user_model_path), batch_size=4, truncate_long_and_double=True)


        metadata = {
            "labels": predictor.class_labels.tolist(),
        }

        with open(f"{user_model_path}/metadata.json", "w") as f:
            json.dump(metadata, f, sort_keys=True, indent=4, ensure_ascii=False)

        print(f"Metadata saved")
        
        print(f"Training completed. Model save to {exported_path}")

        end = perf_counter()

        return {
            "metrics": "temp_metrics",
            "training_evaluation_time": end - start,
            "saved_model_path": user_model_path,
        }
        print("Training model successfully")


    except Exception as e:
        print(e)
        # raise HTTPException(status_code=500, detail=f"Error in downloading or extracting folder: {str(e)}")
    # finally:
    # if os.path.exists(temp_dataset_path):
    #    os.remove(temp_dataset_path)
    # return {}
