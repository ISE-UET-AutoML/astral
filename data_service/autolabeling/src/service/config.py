from src.utils.config import get_config
from src.service.classification import image_classification
from src.service.classification import text_classification


def error(*args):
    return "error not find labeling service task"


def get_auto_label_service(task_type):
    if task_type == get_config().IMAGE_CLASSIFICATION_TAG:
        return image_classification
    if task_type == get_config().TEXT_CLASSIFICATION_TAG:
        return text_classification
    return error
