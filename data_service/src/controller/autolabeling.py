# from "../../utils/config" import get_config
# import get_config
from api.project import get_project_infor, get_project_data
from service.autolabeling import (
    labeling_data_images_classification,
    labeling_data_text_classification,
)
from settings.config import get_config


def label_project_data(body):
    project_info = body["project"]
    project_data = body["data"]
    # print(len(project_data["data"]["files"]), project_data["data"])
    labeled_data = []
    unlabeled_data = []
    for data_point in project_data["data"]["files"]:
        if "label_id" not in data_point:
            unlabeled_data.append(data_point)
        elif "label_by" in data_point and data_point["label_by"] == "human":
            labeled_data.append(data_point)
        else:
            unlabeled_data.append(data_point)
    # TODO: check labeled size
    print("unlabel", len(unlabeled_data))
    print("labeled", labeled_data)
    if project_info["type"] == get_config().IMAGE_CLASSIFICATION_TAG:
        label_mapping = dict()
        for idx, lb in enumerate(project_data["data"]["labels"]):
            label_mapping[lb["id"]] = idx
            print(idx, lb["value"])
        return labeling_data_images_classification(
            labeled_data, unlabeled_data, label_mapping
        )
    if project_info["type"] == get_config().TEXT_CLASSIFICATION_TAG:
        label_mapping = dict()
        for idx, lb in enumerate(project_data["data"]["labels"]):
            label_mapping[lb["id"]] = idx
            print(idx, lb["value"])
        return labeling_data_text_classification(
            labeled_data, unlabeled_data, label_mapping
        )
    return "error"
