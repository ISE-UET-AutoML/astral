import os
from pathlib import Path
from re import sub
import shutil
import subprocess
import celery
from fastapi import APIRouter, Form
import requests
from torch import tensor
from .train.routes_v1 import router as train_router
from .train.routes_v2 import router as train_router_v2
from .autogluon_zeroshot.routes import router as zeroshot_router
from settings.config import (
    TEMP_DIR,
    celery_client,
    redis_client,
    BACKEND_HOST,
    ACCESS_TOKEN,
    REFRESH_TOKEN,
)

from celery.result import AsyncResult


router = APIRouter()
router.include_router(train_router, prefix="/train")
router.include_router(train_router_v2, prefix="/train")
router.include_router(zeroshot_router, prefix="/zeroshot")


@router.get("/cel_test")
def test_celery():
    task_id = celery_client.send_task(
        "time_test", kwargs={"request": {}}, queue="ml_celery"
    )
    print(task_id)
    return {"task_id": str(task_id)}


@router.get("/status/{task_id}")
def status(task_id):
    result = celery_client.AsyncResult(task_id)
    return {"status": result.status}


@router.get("/result/{task_id}")
def result(task_id):
    result = celery_client.AsyncResult(task_id)
    status = result.status
    if status == "SUCCESS":
        return {"status": status, "result": result.get()}
    return {"status": status, "result": ""}


@router.post("/delete_project")
def delete_project(user_name: str = Form("test-automl"), project_id: str = Form(...)):
    path = f"{TEMP_DIR}/{user_name}/{project_id}"
    if os.path.exists(path):
        shutil.rmtree(path)
        return {"message": "SUCCESS"}
    return {"message": "project not found"}


@router.post("/delete_experiment")
def delete_run(
    user_name: str = Form("test-automl"),
    project_id: str = Form(...),
    experiment_name: str = Form(...),
):
    path = f"{TEMP_DIR}/{user_name}/{project_id}/trained_models/ISE/{experiment_name}"
    if os.path.exists(path):
        shutil.rmtree(path)
        return {"message": "SUCCESS"}
    return {"message": "experiment not found"}
