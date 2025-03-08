from src.service.config import get_auto_label_service


def label_project_data(body):
    project_info = body["project"]
    project_data = body["data"]
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
    # print("unlabel", len(unlabeled_data))
    # print("labeled", labeled_data)
    label_service = get_auto_label_service(project_info["type"])
    label_mapping = dict()
    for idx, lb in enumerate(project_data["data"]["labels"]):
        label_mapping[lb["id"]] = idx
        # print(idx, lb["value"])
    return label_service(labeled_data, unlabeled_data, label_mapping)
