import time
from unittest import result
from celery import shared_task
from ._TrainTasks import BaseTrainTask
import requests
from . import _image_classify
from . import _tabular_classify
from . import _object_detection
from . import _generic_mm_prediction
from . import _image_segmentation
from . import _named_entity_recognition
from . import _text_text_semantic_matching
from . import _img_img_semantic_matching
from . import _time_series
from . import _text_prediction
from . import _generic_cloud_training
from . import _generic_cloud_deploy
from settings.config import BACKEND_HOST


@shared_task(
    bind=True,
    name="time_test",
)
def time_test(self, request: dict):
    time.sleep(10)
    return "time_test"

@shared_task(
    bind=True,
    name="model_service.image_classify.train",
    base=BaseTrainTask,
)
def image_classify_train(self, request: dict):
    result = _image_classify.train(self.request.id, request)
    return result


@shared_task(
    bind=True,
    name="model_service.text_prediction.train",
    base=BaseTrainTask,
)
def text_prediction_train(self, request: dict):
    result = _text_prediction.train(self.request.id, request)
    return result


@shared_task(
    bind=True,
    name="model_service.tabular_classify.train",
    base=BaseTrainTask,
)
def tabular_classify_train(self, request: dict):
    return _tabular_classify.train(self.request.id, request)


@shared_task(
    bind=True,
    name="model_service.object_detection.train",
)
def object_detection_train(self, request: dict):
    return _object_detection.train(self.request.id, request)


@shared_task(
    bind=True,
    name="model_service.generic_mm_prediction.train",
    base=BaseTrainTask,
)
def generic_mm_prediction_train(self, request: dict):
    return _generic_mm_prediction.train(self.request.id, request)


@shared_task(
    bind=True,
    name="model_service.image_segmentation.train",
)
def image_segmentation_train(self, request: dict):
    return _image_segmentation.train(self.request.id, request)


@shared_task(
    bind=True,
    name="model_service.named_entity_recognition.train",
)
def named_entity_recognition_train(self, request: dict):
    return _named_entity_recognition.train(self.request.id, request)


@shared_task(
    bind=True,
    name="model_service.text_text_semantic_matching.train",
)
def text_text_semantic_matching_train(self, request: dict):
    return _text_text_semantic_matching.train(self.request.id, request)


@shared_task(
    bind=True,
    name="model_service.img_img_semantic_matching.train",
)
def img_img_semantic_matching_train(self, request: dict):
    return _img_img_semantic_matching.train(self.request.id, request)


@shared_task(
    bind=True,
    name="model_service.time_series.train",
)
def time_series_train(self, request: dict):
    return _time_series.train(self.request.id, request)


import asyncio


@shared_task(
    bind=True,
    name="model_service.generic_multimodal.temp_predict",
)
def generic_multimodal_temp_predict(self, request: dict):
    return asyncio.run(_generic_mm_prediction.predict(self.request.id, request))


@shared_task(
    bind=True,
    name="model_service.generic_cloud_training.train",
    base=BaseTrainTask,
)
def generic_cloud_train(self, request: dict):
    result = _generic_cloud_training.train(self.request.id, request)
    return result

@shared_task(
    bind=True,
    name="model_service.generic_cloud_training.deploy",
    base=BaseTrainTask,
)
def generic_cloud_deploy(self, request: dict):
    result = _generic_cloud_deploy.deploy(self.request.id, request)
    return result