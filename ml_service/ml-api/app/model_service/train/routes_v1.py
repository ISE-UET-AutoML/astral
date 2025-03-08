from math import e
from pyexpat import model
import uuid
from fastapi import APIRouter, File, Form, UploadFile
from settings.config import celery_client, redis_client
from .temp_predict import router as temp_predict_router
from .celery_predict import router as celery_predict_router
from .temp_explain import router as temp_explain_router
from helpers import time as time_helper
from .TrainRequest import (
    GenericMultiModalTrainRequest,
    ImageClassifyTrainRequest,
    ImageSegmentationTrainRequest,
    NamedEntityRecognitionTrainRequest,
    ObjectDetectionTrainRequest,
    TTSemanticMatchingTrainRequest,
    TabularTrainRequest,
    TimeSeriesTrainRequest,
    TrainingProgressRequest,
    DeployProgressRequest
)
from settings.config import TEMP_DIR
import requests
import os
from autogluon.tabular import TabularPredictor
from utils.aws import create_presigned_url
from utils.ssh_utils import connect_with_retries, get_private_key_filename
import re

router = APIRouter()
router.include_router(temp_predict_router, prefix="")
router.include_router(celery_predict_router, prefix="")
router.include_router(temp_explain_router, prefix="")

from .temp_predict import load_model, load_model_from_path, find_latest_model, find_latest_tabular_model


from tensorboard.backend.event_processing.event_accumulator import EventAccumulator
import pandas as pd
import paramiko


@router.get(
    "/fit_history/",
    description=("Get fit history of a model.\nOnly work with multimmodal model"),
)
async def get_fit_history(
    userEmail: str = "test-automl",
    projectName: str = "petfinder",
    runName: str = "ISE",
    task_id: str = "lastest",
):
    
    fit_history_path = f"{userEmail}/{projectName}/{task_id}/model_fit_history.json"
    
    fit_history_url = create_presigned_url(fit_history_path)
    
    res = requests.get(fit_history_url)
    
    print(res)
    
    
    return res.json()

# @router.get(
#     "/tabular_model_ranking",
#     description=("Get ranking of tabular models"),
# )
async def get_tabular_model_ranking(
    userEmail: str = "test-automl",
    projectName: str = "petfinder",
    runName: str = "ISE",
    task_id: str = "lastest",
):
    if task_id == "lastest":
        model_path = find_latest_tabular_model(f"{TEMP_DIR}/{userEmail}/{projectName}/trained_models/{runName}").removesuffix("/predictor.pkl")
    else:
        model_path = f"{TEMP_DIR}/{userEmail}/{projectName}/trained_models/{runName}/{task_id}"
    predictor=TabularPredictor.load(model_path)

    return {
        "fit_summary": predictor.fit_summary(),
        "model_ranking": predictor.leaderboard()
        }

@router.post(
    "/tabular_classification",
    tags=["tabular_classification"],
    description="Train tabular classification model, can also be used for tabular regression\nfaster and better performance multimodal",
)
async def train_tabular_classification(request: TabularTrainRequest):
    # this can also train tabular regression, but might change in the future
    print("Tabular Classification Training request received")

    task_id = celery_client.send_task(
        "model_service.tabular_classify.train",
        kwargs={
            "request": request.dict(),
        },
        queue="ml_celery",
    )
    return {
        "task_id": str(task_id),
        "send_status": "SUCCESS",
    }


@router.post("/image_classification", tags=["image_classification"])
async def train_image_classification(request: ImageClassifyTrainRequest):
    print("Image Classification Training request received")

    task_id = celery_client.send_task(
        "model_service.image_classify.train",
        kwargs={
            "request": request.dict(),
        },
        queue="ml_celery",
    )

    return {
        "task_id": str(task_id),
        "send_status": "SUCCESS",
    }


@router.post("/object_detection", tags=["object_detection"])
async def train_object_detection(request: ObjectDetectionTrainRequest):
    print("Object Detection Training request received")

    task_id = celery_client.send_task(
        "model_service.object_detection.train",
        kwargs={
            "request": request.dict(),
        },
        queue="ml_celery",
    )

    return {
        "task_id": str(task_id),
        "send_status": "SUCCESS",
    }


@router.post(
    "/generic_multimodal_prediction",
    tags=["generic_multimodal"],
)
async def train_generic_mm_prediction(request: GenericMultiModalTrainRequest):
    print("Generic Multimodal Prediction Training request received")

    task_id = celery_client.send_task(
        "model_service.generic_mm_prediction.train",
        kwargs={
            "request": request.dict(),
        },
        queue="ml_celery",
    )

    return {
        "task_id": str(task_id),
        "send_status": "SUCCESS",
    }


@router.post(
    "/image_segmentation",
    tags=["image_segmentation"],
)
async def train_image_segmentation(request: ImageSegmentationTrainRequest):
    print("Image Segmentation Training request received")

    task_id = celery_client.send_task(
        "model_service.image_segmentation.train",
        kwargs={
            "request": request.dict(),
        },
        queue="ml_celery",
    )

    return {
        "task_id": str(task_id),
        "send_status": "SUCCESS",
    }


@router.post(
    "/named_entity_recognition",
    tags=["named_entity_recognition"],
)
async def train_named_entity_recognition(request: NamedEntityRecognitionTrainRequest):
    print("Named Entity Recognition Training request received")

    task_id = celery_client.send_task(
        "model_service.named_entity_recognition.train",
        kwargs={
            "request": request.dict(),
        },
        queue="ml_celery",
    )

    return {
        "task_id": str(task_id),
        "send_status": "SUCCESS",
    }


@router.post(
    "/text_text_semantic_matching",
    tags=["semantic_matching"],
)
def train_text_text_semantic_matching(request: TTSemanticMatchingTrainRequest):
    print("Text Text Semantic Matching Training request received")

    task_id = celery_client.send_task(
        "model_service.text_text_semantic_matching.train",
        kwargs={
            "request": request.dict(),
        },
        queue="ml_celery",
    )

    return {
        "task_id": str(task_id),
        "send_status": "SUCCESS",
    }


@router.post(
    "/img_img_semantic_matching",
    tags=["semantic_matching"],
)
def train_img_semantic_matching(request: TTSemanticMatchingTrainRequest):
    print("Text Text Semantic Matching Training request received")

    task_id = celery_client.send_task(
        "model_service.img_img_semantic_matching.train",
        kwargs={
            "request": request.dict(),
        },
        queue="ml_celery",
    )

    return {
        "task_id": str(task_id),
        "send_status": "SUCCESS",
    }


@router.post(
    "/time_series",
    tags=["time_series"],
)
def train_time_series(request: TimeSeriesTrainRequest):
    print("Time Series Training request received")

    task_id = celery_client.send_task(
        "model_service.time_series.train",
        kwargs={
            "request": request.dict(),
        },
        queue="ml_celery",
    )

    return {
        "task_id": str(task_id),
        "send_status": "SUCCESS",
    }

@router.post(
    "/training_progress",
    description=("Get training progress of a training job."),
)
async def get_training_progress(
    req: TrainingProgressRequest
):
    
    ip = req.instance_info.public_ip
    port = req.instance_info.ssh_port
    username = "root"
    
    # input: task_id, instance_info
    
    # use instance_info to ssh into the instance and get training progress from a txt file
    print(req)
    
    private_key_path = get_private_key_filename(req.task_id)
    
    # Connect to the remote server with custom port
    try:
        ssh_client = connect_with_retries(ip, port, username, private_key_path, max_retries=10, delay=5)
    except Exception as e:
        return {"status": "error", "error": str(e)}
    
    latest_epoch = None
    metrics = {}
    
    stdin, stdout, stderr = ssh_client.exec_command(f"test -d ./{req.task_id} && echo 1 || echo 0")
    print("Errors:", stderr.read().decode())
    
    if not int(stdout.read().decode()):
        return {"status": "SETTING_UP", "latest_epoch": None, "metrics": {}}
    
    stdin, stdout, stderr = ssh_client.exec_command(f"test -f ./{req.task_id}/training_logs.txt && echo 1 || echo 0")
    print("Errors:", stderr.read().decode())
    
    if not int(stdout.read().decode()):
        return {"status": "DOWNLOADING_DATA", "latest_epoch": None, "metrics": {}}
    
    stdin, stdout, stderr = ssh_client.exec_command(f"cat ./{req.task_id}/training_logs.txt")
    print("Errors:", stderr.read().decode())
    
    log_data = stdout.read().decode()
    status = "TRAINING"
    # Extract data from logs
    
    # Regular expressions
    epoch_pattern = re.compile(r"Epoch (\d+),")
    metric_pattern = re.compile(r"'(val_\w+)' reached ([\d\.]+)")
    
    
    for line in log_data.splitlines():
        # Extract the epoch number
        epoch_match = epoch_pattern.search(line)
        if epoch_match:
            latest_epoch = int(epoch_match.group(1))

        # Extract metrics and their values
        metric_matches = metric_pattern.findall(line)
        for metric, value in metric_matches:
            metrics[metric] = float(value)

    # Return the extracted information
    return {
        "status": status,
        "latest_epoch": latest_epoch,
        "metrics": metrics
    }
    
@router.post(
    "/deploy_progress",
    description=("Get deploy status of a deploy job."),
)
async def get_deploy_progress(
    req: DeployProgressRequest
):
    
    ip = req.instance_info.public_ip
    port = req.instance_info.ssh_port
    username = "root"
    
    
    # use instance_info to ssh into the instance and get deploy progress 
    print(req)
    
    private_key_path = get_private_key_filename(req.task_id)
    
    # Connect to the remote server with custom port
    try:
        ssh_client = connect_with_retries(ip, port, username, private_key_path, max_retries=2, delay=5)
        # Test if the instance is already setup
        stdin, stdout, stderr = ssh_client.exec_command(f"test -d ./{req.task_id} && echo 1 || echo 0")
        print("Errors:", stderr.read().decode())
        
        if not int(stdout.read().decode()):
            return {"status": "SETTING_UP"}
        
        # Test if the instance is downloading the model
        stdin, stdout, stderr = ssh_client.exec_command(f"test -d ./{req.task_id}/model && echo 1 || echo 0")
        print("Errors:", stderr.read().decode())
        
        if not int(stdout.read().decode()):
            return {"status": "DOWNLOADING_MODEL"}
        
        # Temporary hardcode value for all instances
        container_port = 8680
        
        # Test if the instance is serving at the dedicated port 
        stdin, stdout, stderr = ssh_client.exec_command(f"lsof -i :{container_port}")
        print("Errors:", stderr.read().decode())
        
        output = stdout.read().decode()
        print(output)
        if output:
            return {"status": "ONLINE"}
    except Exception as e:
        print(e)
        return {"status": "ERROR", "error": str(e)}
    
    return {
        "status": "DOWNLOADING_MODEL"
    }


# @router.get(
#     "/tabular_model_ranking",
#     description=("Get ranking of tabular models"),
# )
# async def get_tabular_fit_history(
#     userEmail: str = "test-automl",
#     projectName: str = "petfinder",
#     runName: str = "ISE",
#     task_id: str = "lastest",
# ):
#     fit_history_path = f"{userEmail}/{projectName}/{task_id}/model_fit_history.json"
    
#     fit_history_url = create_presigned_url(fit_history_path)
    
#     res = requests.get(fit_history_url)
    
#     print(res)
    
    
#     return res.json()

#     return {
#         "fit_summary": predictor.fit_summary(),
#         "model_ranking": predictor.leaderboard()
#         }