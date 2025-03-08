from time import perf_counter
from autogluon.multimodal import MultiModalPredictor
import joblib
from settings.config import TEMP_DIR

from utils.dataset_utils import (
    download_dataset2,
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

        # try:
        #     exported_path = predictor.export_onnx(data=train_df[0:1], path=user_model_path, truncate_long_and_double=True)
        # except Exception as e:
        #     print(f"An error occurred: {e}")

        

        # metrics = predictor.evaluate(test_data, metrics=request["metrics"])
        # print("Training model successfully")

        end = perf_counter()

        metadata = {
                "labels": predictor.class_labels.tolist(),
            }
        with open(f"{user_model_path}/metadata.json", "w") as f:
            json.dump(metadata, f, sort_keys=True, indent=4, ensure_ascii=False)

        print(f"Metadata saved")
        
        print(f"Training completed. Model save to {exported_path}")

        return {
            "metrics": "temp_metrics",
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


memory = joblib.Memory(
    f"{TEMP_DIR}", verbose=0, mmap_mode="r", bytes_limit=1024 * 1024 * 1024 * 100
)


@memory.cache
def load_model_from_path(model_path: str) -> MultiModalPredictor:
    return MultiModalPredictor.load(model_path)


async def load_model(
    user_name: str, project_name: str, run_name: str
) -> MultiModalPredictor:
    model_path = find_latest_model(
        f"{TEMP_DIR}/{user_name}/{project_name}/trained_models/{run_name}"
    )
    print("model path: ", model_path)
    return load_model_from_path(model_path)


async def predict(task_id: str, request: dict):
    print("task_id:", task_id)
    print("request:", request)
    print("MultiModal Prediction request received")
    start = perf_counter()
    try:
        user_dataset_path = f"{TEMP_DIR}/{request['userEmail']}/{request['projectName']}/dataset/predict/"
        os.makedirs(user_dataset_path, exist_ok=True)

        user_dataset_path = download_dataset(
            user_dataset_path,
            True,
            request["dataset"],
            request["dataset"]["dataset_download_method"],
        )
        predict_file = request["predict_file"]
        if predict_file == None:
            predict_file = find_in_current_dir(
                "", user_dataset_path, is_pattern=True, extension=".csv"
            )
        predict_file = f"{user_dataset_path}/{predict_file}"

        predict_data = pd.read_csv(predict_file)
        for img_col in request["image_cols"]:
            predict_data[img_col] = predict_data[img_col].apply(
                lambda x: f"{user_dataset_path}/{x}"
            )

        model = await load_model(
            request["userEmail"], request["projectName"], request["runName"]
        )
        load_end = perf_counter()

        if request["evaluate"] == True:
            metrics = model.evaluate(predict_data)
            end = perf_counter()
            return {
                "status": "success",
                "message": "Evaluation completed",
                "load_time": load_end - start,
                "evaluation_time": end - load_end,
                "metrics": str(metrics),
            }
        else:
            predictions = model.predict(predict_data)
            try:
                proba = model.predict_proba(predict_data)
                proba = proba.to_csv()
            except Exception as e:
                proba = "None"
            end = perf_counter()
            return {
                "status": "success",
                "message": "Prediction completed",
                "load_time": load_end - start,
                "inference_time": end - load_end,
                "proba": proba,
                "predictions": predictions.to_csv(),
            }
    except Exception as e:
        print(e)
        return {"status": "error", "message": str(e)}
    finally:
        pass
