from fastapi import APIRouter, File, Form, UploadFile

from settings.config import TEMP_DIR
from .PredictRequest import GenericMultiModalPredictRequest
from settings.config import celery_client, redis_client


router = APIRouter()


@router.post(
    "/generic_multimodal/temp_predict",
    tags=["generic_multimodal"],
    description="prediction with celery, use task id to get result",
)
def generic_multimodal_temp_predict(request: GenericMultiModalPredictRequest):
    print("Generic multimodal temp predict request received")
    task_id = celery_client.send_task(
        "model_service.generic_multimodal.temp_predict",
        kwargs={
            "request": request.dict(),
        },
        queue="ml_celery",
    )
    return {
        "task_id": str(task_id),
        "send_status": "SUCCESS",
    }
