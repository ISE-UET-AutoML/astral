from fastapi import APIRouter
from .TrainRequest import SimpleTrainRequest, CloudTrainRequest, CloudDeployRequest
from settings.config import BACKEND_HOST, celery_client

router = APIRouter()


@router.post("/v2/image_classification", tags=["v2"])
async def train_image_classification(request: SimpleTrainRequest):
    payload = {
        "userEmail": request.userEmail,
        "projectName": request.projectId,
        "training_time": request.training_time,
        "runName": request.runName,
        "presets": request.presets,
        "dataset_url": request.ds_projectId,
        "dataset_download_method": "data_service",
        "training_argument": {
            "data_args": {},
            "ag_model_args": {
                "pretrained": True,
                "hyperparameters": {
                    "model.timm_image.checkpoint_name": "swin_small_patch4_window7_224"
                },
            },
            "ag_fit_args": {
                "time_limit": 600,
                "hyperparameters": {
                    "env.precision": "bf16-mixed",
                    "env.per_gpu_batch_size": 4,
                    "env.batch_size": 4,
                    "optimization.efficient_finetune": "lora",
                    "optimization.log_every_n_steps": 2,
                    "model.timm_image.checkpoint_name": "swin_small_patch4_window7_224",
                },
            },
        },
        "label_column": "label",
    }

    task_id = celery_client.send_task(
        "model_service.image_classify.train",
        kwargs={
            "request": payload,
        },
        queue="ml_celery",
    )

    return {
        "task_id": str(task_id),
        "send_status": "SUCCESS",
    }


@router.post("/v2/text_prediction", tags=["v2"])
async def train_text_prediction(request: SimpleTrainRequest):
    # TODO fix dataset
    payload = {
        "userEmail": request.userEmail,
        "projectName": request.projectId,
        "training_time": request.training_time,
        "runName": request.runName,
        "presets": request.presets,
        "dataset_url": request.ds_projectId,
        "dataset_download_method": "data_service",
        "label_column": "label",
        "training_argument": {
            "ag_fit_args": {
                "hyperparameters": {
                    "env.per_gpu_batch_size": 4,
                    "env.batch_size": 4,
                    "optimization.efficient_finetune": "lora",
                    "optimization.log_every_n_steps": 24,
                },
            },
        },
        "problem_type": None,
        "image_cols": [],
        "metrics": ["acc", "f1", "precision", "recall", "roc_auc"],
    }

    task_id = celery_client.send_task(
        "model_service.text_prediction.train",
        kwargs={
            "request": payload,
        },
        queue="ml_celery",
    )

    return {
        "task_id": str(task_id),
        "send_status": "SUCCESS",
    }


@router.post("/v2/tabular_classification", tags=["v2"])
async def train_tabular_classification(request: SimpleTrainRequest):
    payload = {
        "userEmail": request.userEmail,
        "projectName": request.projectId,
        "training_time": request.training_time,
        "runName": request.runName,
        "presets": request.presets,
        "dataset_url": request.ds_projectId,
        "dataset_download_method": "data_service",
        "label_column": "label",
        "training_argument": {},
        "problem_type": None,
        "image_cols": [],
        "metrics": ["acc", "f1", "precision", "recall", "roc_auc"],
    }

    task_id = celery_client.send_task(
        "model_service.tabular_classify.train",
        kwargs={
            "request": payload,
        },
        queue="ml_celery",
    )

    return {
        "task_id": str(task_id),
        "send_status": "SUCCESS",
    }


@router.post("/v2/multimodal_classification", tags=["v2"])
async def train_multimodal_classification(request: SimpleTrainRequest):
    payload = {
        "userEmail": request.userEmail,
        "projectName": request.projectId,
        "training_time": request.training_time,
        "runName": request.runName,
        "presets": request.presets,
        "dataset_url": request.ds_projectId,
        "dataset_download_method": "data_service",
        "label_column": "label",
        "training_argument": {
            "ag_fit_args": {
                "hyperparameters": {},
            },
        },
        "problem_type": None,
        "image_cols": [],
        "metrics": ["accuracy", "f1", "precision", "recall"],
    }

    task_id = celery_client.send_task(
        "model_service.generic_mm_prediction.train",
        kwargs={
            "request": payload,
        },
        queue="ml_celery",
    )

    return {
        "task_id": str(task_id),
        "send_status": "SUCCESS",
    }

@router.post("/v2/generic_cloud_training", tags=["v2"])
async def train_generic_cloud(request: CloudTrainRequest):
    payload = {
        "username": request.username,
        "task": request.task,
        "project_id": request.project_id,
        "training_time": request.training_time,
        "presets": request.presets,
        "dataset_url": request.dataset_url,
        "dataset_label_url": request.dataset_label_url,
        "instance_info": {
            "id": request.instance_info.id,
            "ssh_port": request.instance_info.ssh_port,
            "public_ip": request.instance_info.public_ip,
            "deploy_port": request.instance_info.deploy_port,
        },
        "target_column": request.target_column,
        "image_column": request.image_column,
    }
    
    # print(request.target_column)
    # print(request.image_column)
    
    # return {"status": "success"}
    

    task_id = celery_client.send_task(
        "model_service.generic_cloud_training.train",
        kwargs={
            "request": payload,
        },
        queue="ml_celery",
    )

    return {
        "task_id": str(task_id),
        "send_status": "SUCCESS",
    }

@router.post("/v2/generic_cloud_deploy", tags=["v2"])
async def deploy_generic_cloud(request: CloudDeployRequest):
    payload = {
        "username": request.username,
        "task": request.task,
        "task_id": request.task_id,
        "project_id": request.project_id,
        "deploy_type": request.deploy_type,
        "instance_info": {
            "id": request.instance_info.id,
            "ssh_port": request.instance_info.ssh_port,
            "public_ip": request.instance_info.public_ip,
            "deploy_port": request.instance_info.deploy_port,
        },
    }

    task_id = celery_client.send_task(
        "model_service.generic_cloud_training.deploy",
        kwargs={
            "request": payload,
        },
        queue="ml_celery",
    )

    return {
        "task_id": str(task_id),
        "send_status": "SUCCESS",
    }