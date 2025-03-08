import base64
from email.mime import image
from io import StringIO
import re
from typing import Optional, Union
from urllib import response
from zipfile import ZipFile
from fastapi import APIRouter, File, Form, UploadFile
import pandas
from sympy import false, use
from time import perf_counter
from autogluon.multimodal import MultiModalPredictor
from autogluon.tabular import TabularPredictor
from autogluon.timeseries import TimeSeriesPredictor, TimeSeriesDataFrame
from .explainers.ImageExplainer import ImageExplainer
import joblib
from settings.config import TEMP_DIR
import shutil
import numpy as np
import pandas as pd
import uuid
from typing import Annotated

from utils.dataset_utils import (
    find_latest_model,
    find_latest_tabular_model,
    split_data,
    create_csv,
    remove_folders_except,
    create_folder,
)
import os
from pathlib import Path

router = APIRouter()

memory = joblib.Memory(
    f"{TEMP_DIR}", verbose=0, mmap_mode="r", bytes_limit=1024 * 1024 * 1024 * 100
)


@memory.cache
def load_model_from_path(model_path: str) -> MultiModalPredictor:
    return MultiModalPredictor.load(model_path)


@memory.cache
def load_tabular_model_from_path(model_path: str) -> TabularPredictor:
    #! tabular predictor load model from the folder containing the model
    return TabularPredictor.load(os.path.dirname(model_path))


@memory.cache
def load_timeseries_model_from_path(model_path: str) -> TimeSeriesPredictor:
    #! tabular predictor load model from the folder containing the model
    return TimeSeriesPredictor.load(os.path.dirname(model_path))


async def load_model(
    user_name: str, project_name: str, run_name: str
) -> MultiModalPredictor:
    if run_name == "ISE":
        model_path = find_latest_model(
            f"{TEMP_DIR}/{user_name}/{project_name}/trained_models/{run_name}"
        )
    else:
        model_path = f"{TEMP_DIR}/{user_name}/{project_name}/trained_models/ISE/{run_name}/model.ckpt"

    print("model path: ", model_path)
    return load_model_from_path(model_path)


async def load_timeseries_model(
    user_name: str, project_name: str, run_name: str
) -> TimeSeriesPredictor:
    model_path = find_latest_tabular_model(
        f"{TEMP_DIR}/{user_name}/{project_name}/trained_models/ISE/{run_name}"
    )
    print("model path: ", model_path)
    return load_timeseries_model_from_path(model_path)


async def load_tabular_model(
    user_name: str, project_name: str, run_name: str
) -> TabularPredictor:
    model_path = find_latest_tabular_model(
        f"{TEMP_DIR}/{user_name}/{project_name}/trained_models/ISE/{run_name}"
    )
    print("model path: ", model_path)
    return load_tabular_model_from_path(model_path)


# image predict
@router.post(
    "/image_classification/temp_predict",
    tags=["image_classification"],
    description="Only use in dev and testing, not for production",
)
async def img_class_predict(
    userEmail: str = Form("test-automl"),
    projectName: str = Form("4-animal"),
    runName: str = Form("ISE"),
    files: list[UploadFile] = File(...),
):
    print(userEmail)
    print("Run Name:", runName)

    try:
        predictions = []
        # write the image to a temporary file
        temp_image_folder = f"{TEMP_DIR}/{userEmail}/{projectName}/temp_predict"
        os.makedirs(temp_image_folder, exist_ok=True)

        temp_image_df = pd.DataFrame(columns=["image"])
        for image in files:
            temp_image_path = f"{temp_image_folder}/{image.filename}"
            with open(temp_image_path, "wb") as buffer:
                buffer.write(await image.read())
            temp_image_df = temp_image_df._append(
                {"image": temp_image_path}, ignore_index=True
            )

        start_load = perf_counter()
        # TODO : Load model with any path
        model = await load_model(userEmail, projectName, runName)
        load_time = perf_counter() - start_load
        inference_start = perf_counter()
        probas = model.predict_proba(temp_image_df, as_pandas=False, as_multiclass=True)

        for proba in probas:
            predictions.append(
                {
                    "key": str(uuid.uuid4()),
                    "class": str(model.class_labels[np.argmax(proba)]),
                    "confidence": round(float(max(proba)), 2),
                }
            )

        return {
            "status": "success",
            "message": "Prediction completed",
            "load_time": load_time,
            "inference_time": perf_counter() - inference_start,
            "predictions": predictions,
        }
    except Exception as e:
        print(e)
    finally:
        if os.path.exists(temp_image_folder):
            shutil.rmtree(temp_image_folder)


@router.post(
    "/tabular_classification/temp_predict",
    tags=["tabular_classification"],
    description="Only use in dev and testing, not for production",
)
async def tab_predict(
    userEmail: str = Form(...),
    projectName: str = Form(...),
    runName: str = Form(...),
    data_path: str = Form(...),
):
    print(userEmail)
    print(runName)
    print(data_path)
    
    
    try:
        df = pandas.read_csv(data_path)
        df.columns = ['data-VAL-' + col for col in df.columns]
        start_load = perf_counter()
        # TODO : Load model with any path

        print("Loading model")
        model = await load_tabular_model(userEmail, projectName, runName)
        print("Model loaded")

        load_time = perf_counter() - start_load
        inference_start = perf_counter()
        predictions = []
        try:
            probas = model.predict_proba(
                df, as_pandas=False, as_multiclass=True
            )
            
            for proba in probas:
                print(proba)
                predictions.append(
                    {
                        "key": str(uuid.uuid4()),
                        "class": model.class_labels[np.argmax(proba)],
                        "confidence": round(float(max(proba)), 2),
                    }
                )
        except Exception as e:
            print(e)
        return {
            "status": "success",
            "message": "Prediction completed",
            "load_time": load_time,
            "inference_time": perf_counter() - inference_start,
            "predictions": predictions,
        }
    except Exception as e:
        print(e)

@router.post(
    "/multimodal_classification/temp_predict",
    tags=["multimodal_classification"],
    description="Only use in dev and testing, not for production",
)
async def multimodal_predict(
    userEmail: str = Form(...),
    projectName: str = Form(...),
    runName: str = Form(...),
    data_path: str = Form(...),
):
    print(userEmail)
    print(runName)
    print(data_path)
    
    return {"status": "success"}

    try:
        df = pandas.read_csv(data_path)
        df.columns = ['data-VAL-' + col for col in df.columns]
        start_load = perf_counter()
        # TODO : Load model with any path

        print("Loading model")
        model = await load_model(userEmail, projectName, runName)
        print("Model loaded")

        load_time = perf_counter() - start_load
        inference_start = perf_counter()
        predictions = []
        try:
            probas = model.predict_proba(
                df, as_pandas=False, as_multiclass=True
            )
            
            for proba in probas:
                print(proba)
                predictions.append(
                    {
                        "key": str(uuid.uuid4()),
                        "class": model.class_labels[np.argmax(proba)],
                        "confidence": round(float(max(proba)), 2),
                    }
                )
        except Exception as e:
            print(e)
        return {
            "status": "success",
            "message": "Prediction completed",
            "load_time": load_time,
            "inference_time": perf_counter() - inference_start,
            "predictions": predictions,
        }
    except Exception as e:
        print(e)


@router.post(
    "/object_detection/temp_predict",
    tags=["object_detection"],
    description="Only use in dev and testing, not for production",
)
async def obj_predict(
    userEmail: str = Form("test-automl"),
    projectName: str = Form("tiny-motobike"),
    runName: str = Form("ISE"),
    image: UploadFile = File(...),
):
    print(userEmail)
    print("Run Name:", runName)
    try:
        # write the image to a temporary file
        temp_image_path = f"{TEMP_DIR}/{userEmail}/{projectName}/temp.jpg"
        os.makedirs(Path(temp_image_path).parent, exist_ok=True)
        with open(temp_image_path, "wb") as buffer:
            buffer.write(await image.read())

        start_load = perf_counter()
        # TODO : Load model with any path
        model = await load_model(userEmail, projectName, runName)
        load_time = perf_counter() - start_load
        inference_start = perf_counter()
        predictions: pandas.DataFrame = model.predict(temp_image_path, realtime=True)

        print(predictions)

        return {
            "status": "success",
            "message": "Prediction completed",
            "load_time": load_time,
            "proba": "Not a classification problem",
            "inference_time": perf_counter() - inference_start,
            "predictions": predictions.to_csv(),
        }
    except Exception as e:
        print(e)
    finally:
        if os.path.exists(temp_image_path):
            os.remove(temp_image_path)


@router.post(
    "/image_segmentation/temp_predict",
    tags=["image_segmentation"],
    description="Only use in dev and testing, not for production",
)
async def img_seg_predict(
    userEmail: str = Form("test-automl"),
    projectName: str = Form("4-animal"),
    runName: str = Form("ISE"),
    image: UploadFile = File(...),
):
    print(userEmail)
    print("Run Name:", runName)
    try:
        # write the image to a temporary file
        temp_image_path = f"{TEMP_DIR}/{userEmail}/{projectName}/temp.jpg"
        os.makedirs(Path(temp_image_path).parent, exist_ok=True)
        with open(temp_image_path, "wb") as buffer:
            buffer.write(await image.read())

        start_load = perf_counter()
        # TODO : Load model with any path
        model = await load_model(userEmail, projectName, runName)
        load_time = perf_counter() - start_load
        inference_start = perf_counter()
        predictions = model.predict({"Unnamed: 0": [0], "image": [temp_image_path]})

        # temp_result_path = f"{TEMP_DIR}/{userEmail}/{projectName}/temp_predict.txt"
        np.set_printoptions(threshold=np.inf)

        # print(predictions)
        return {
            "status": "success",
            "message": "Prediction completed",
            "load_time": load_time,
            "proba": "Not a classification problem",
            "inference_time": perf_counter() - inference_start,
            "predictions": str(predictions[0].astype(int)),
        }
    except Exception as e:
        print(e)
    finally:
        if os.path.exists(temp_image_path):
            os.remove(temp_image_path)


@router.post(
    "/text_prediction/temp_predict",
    tags=["text_prediction"],
    description="Only use in dev and testing, not for production",
)
async def text_predict(
    userEmail: str = Form("darklord1611"),
    projectName: str = Form("66bdc72c8197a434278f525d"),
    runName: str = Form("ISE"),
    text_col: str = Form(
        "text", description="name of the text column in train.csv file"
    ),
    csv_file: UploadFile = File(...),
):
    print(userEmail)
    print("Run Name:", runName)
    print("File:", csv_file.filename)

    try:
        if csv_file:
            temp_csv_path = f"{TEMP_DIR}/{userEmail}/{projectName}/temp.csv"
            with open(temp_csv_path, "wb") as buffer:
                buffer.write(await csv_file.read())

        start_load = perf_counter()
        # TODO : Load model with any path
        model = await load_model(userEmail, projectName, runName)
        load_time = perf_counter() - start_load
        inference_start = perf_counter()

        try:
            pd_df = pd.read_csv(temp_csv_path)
            for col in pd_df.columns:
                if col.lower().__contains__("text") or col.lower().__contains__(
                    "sentence"
                ):
                    text_col = col
                    break
        except Exception as e:
            return {
                "status": "failed",
                "message": "bad request, maybe check your csv file",
            }

        predictions = []

        probabilites = model.predict_proba({"text": pd_df[text_col].values})
        for i, prob in enumerate(probabilites):
            predictions.append(
                {
                    "sentence": pd_df[text_col].values[i],
                    "class": str(model.class_labels[np.argmax(prob)]),
                    "confidence": round(float(max(prob)), 2),
                }
            )
        np.set_printoptions(threshold=np.inf)

        try:
            # proba: pandas.DataFrame = model.predict_proba({text_col: [text]})
            pass
        except Exception as e:
            return {
                "status": "success",
                "message": "Prediction completed",
                "load_time": load_time,
                "proba": "Not a classification problem",
                "inference_time": perf_counter() - inference_start,
                "predictions": str(predictions),
            }

        return {
            "status": "success",
            "message": "Prediction completed",
            "load_time": load_time,
            "proba": "temp",
            "inference_time": perf_counter() - inference_start,
            "predictions": predictions,
        }
    except Exception as e:
        print(e)


@router.post(
    "/text_text_semantic_matching/temp_predict",
    tags=["semantic_matching"],
    description="Only use in dev and testing, not for production",
)
async def text_text_predict(
    userEmail: str = Form("test-automl"),
    projectName: str = Form("snli-text-matching"),
    runName: str = Form("ISE"),
    query: str = Form(
        "premise", description="name of the query column in train.csv file"
    ),
    response: str = Form(
        "hypothesis", description="name of the response column in train.csv file"
    ),
    text1: str = Form(...),
    text2: str = Form(...),
):
    print(userEmail)
    print("Run Name:", runName)
    try:
        start_load = perf_counter()
        # TODO : Load model with any path
        model = await load_model(userEmail, projectName, runName)
        load_time = perf_counter() - start_load
        inference_start = perf_counter()

        predictions = model.predict({query: [text1], response: [text2]})
        np.set_printoptions(threshold=np.inf)

        try:
            proba: pandas.DataFrame = model.predict_proba(
                {query: [text1], response: [text2]}
            )
        except Exception as e:
            return {
                "status": "success",
                "message": "Prediction completed",
                "load_time": load_time,
                "proba": "Not a classification problem",
                "inference_time": perf_counter() - inference_start,
                "predictions": str(predictions),
            }

        return {
            "status": "success",
            "message": "Prediction completed",
            "load_time": load_time,
            "proba": str(proba),
            "inference_time": perf_counter() - inference_start,
            "predictions": str(predictions),
        }
    except Exception as e:
        print(e)


@router.post(
    "/img_img_semantic_matching/temp_predict",
    tags=["semantic_matching"],
    description="Only use in dev and testing, not for production",
)
async def img_img_predict(
    userEmail: str = Form("test-automl"),
    projectName: str = Form("4animal-image-matching"),
    runName: str = Form("ISE"),
    query: str = Form("image1", title="name of the first image column"),
    response: str = Form("image2", title="name of the second image column"),
    image1: UploadFile = File(...),
    image2: UploadFile = File(...),
):
    temp_image_path1 = f"{TEMP_DIR}/{userEmail}/{projectName}/temp1.jpg"
    os.makedirs(Path(temp_image_path1).parent, exist_ok=True)
    with open(temp_image_path1, "wb") as buffer:
        buffer.write(await image1.read())
    temp_image_path2 = f"{TEMP_DIR}/{userEmail}/{projectName}/temp2.jpg"
    os.makedirs(Path(temp_image_path2).parent, exist_ok=True)
    with open(temp_image_path2, "wb") as buffer:
        buffer.write(await image2.read())
    try:
        start_load = perf_counter()
        # TODO : Load model with any path
        model = await load_model(userEmail, projectName, runName)
        load_time = perf_counter() - start_load
        inference_start = perf_counter()

        predictions = model.predict(
            {query: [temp_image_path1], response: [temp_image_path2]}
        )
        np.set_printoptions(threshold=np.inf)

        try:
            proba: pandas.DataFrame = model.predict_proba(
                {query: [temp_image_path1], response: [temp_image_path2]}
            )
        except Exception as e:
            return {
                "status": "success",
                "message": "Prediction completed",
                "load_time": load_time,
                "proba": "Not a classification problem",
                "inference_time": perf_counter() - inference_start,
                "predictions": str(predictions),
            }

        return {
            "status": "success",
            "message": "Prediction completed",
            "load_time": load_time,
            "proba": str(proba),
            "inference_time": perf_counter() - inference_start,
            "predictions": str(predictions),
        }
    except Exception as e:
        print(e)
    finally:
        if os.path.exists(temp_image_path1):
            os.remove(temp_image_path1)
        if os.path.exists(temp_image_path2):
            os.remove(temp_image_path2)


@router.post(
    "/time_series/temp_predict",
    tags=["time_series"],
    description="Only use in dev and testing, not for production",
)
async def time_series_predict(
    userEmail: str = Form("test-automl"),
    projectName: str = Form("time-series"),
    runName: str = Form("ISE"),
    data: UploadFile = File(...),
    known_covariates: Optional[UploadFile] = File(None),
):
    print(userEmail)
    print(runName)
    try:
        test_data = pandas.read_csv(data.file)
        covariates = (
            None if known_covariates is None else pandas.read_csv(known_covariates.file)
        )
        start_load = perf_counter()
        # TODO : Load model with any path

        print("Loading model")
        model = await load_timeseries_model(userEmail, projectName, runName)
        print("Model loaded")

        load_time = perf_counter() - start_load
        inference_start = perf_counter()
        try:
            predictions = model.predict(test_data, covariates)

            return {
                "status": "success",
                "message": "Prediction completed",
                "load_time": load_time,
                "inference_time": perf_counter() - inference_start,
                "predictions": predictions.to_csv(),
            }
        except Exception as e:
            print(e)
            return {
                "status": "failed",
                "message": "bad request, maybe check your known covariates file",
                "description": (
                    "Note that known_covariates must satisfy the following conditions:\n"
                    "The columns must include all columns listed in predictor.known_covariates_names\n"
                    "The item_id index must include all item ids present in train_data\n"
                    "The timestamp index must include the values for prediction_length many time steps into the future from the end of each time series in train_data\n"
                ),
            }
    except Exception as e:
        print(e)