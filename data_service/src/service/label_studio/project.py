from fastapi import HTTPException
from settings import config
from settings.config import label_studio_client
from utils.LabelConfig import LabelConfig
from label_studio_sdk.label_interface import LabelInterface

def list_projects():
    return label_studio_client.get(
        api_key=config.LABEL_STUDIO_API_KEY,
        api="/projects",
    )


def get_project(project_id):
    return label_studio_client.get(
        api_key=config.LABEL_STUDIO_API_KEY,
        api=f"/projects/{project_id}",
    )


def create_project(
    project_name,
    project_description,
    project_type: str | None = None,
    label_config_args: dict | None = None,
):

    payload = {
        "title": project_name,
        "description": project_description,
        "label_config": "<View></View>",
        "expert_instruction": "Label something with some other thing",
        "show_instruction": True,
        "show_skip_button": True,
        "enable_empty_annotation": True,
        "show_annotation_history": True,
        "reveal_preannotations_interactively": True,
        "show_collab_predictions": True,
        "maximum_annotations": 100,  # change to 1 if you want to limit the number of annotations
    }

    print('PROJECT_TYPE : ', project_type)
    print('LABEL_CONFIG_ARGS : ', label_config_args)

    if project_type is not None and label_config_args is not None:
        payload["label_config"] = LabelConfig.get_label_config(
            project_type, label_config_args
        )
    
    print("LABEL_CONFIG : ", payload["label_config"])
        
    return label_studio_client.post(
        api_key=config.LABEL_STUDIO_API_KEY,
        api="projects",
        data=payload,
    )


def update_label_config(
    project_id,
    label_config_args,
):
    project_info = get_project(project_id)
    project_type = project_info["description"]

    print("Project Type",project_type)
    print(label_config_args)
    
    label_config = LabelConfig.get_label_config(
        project_type=project_type, label_config_args=label_config_args
    )
    payload = {
        "label_config": label_config,
    }
    return label_studio_client.patch(
        api_key=config.LABEL_STUDIO_API_KEY,
        api=f"projects/{project_id}",
        data=payload,
    )


def get_label_config(project_id):
    project_info = get_project(project_id)
    project_type = project_info["description"]

    res = {}
    res["project_type"] = project_type
    if project_type.__contains__("CLASSIFICATION"):

        label_interface = LabelInterface(project_info["label_config"])
        res["label_config"] = {}
        try:
            control = label_interface.get_control("label")
        except Exception as e:
            control = None
        if control is not None:
            res["label_config"]["label_choices"] = control.labels

    else:
        raise HTTPException(status_code=400, detail="Project type not supported")

    return res


def delete_project(project_id):
    return label_studio_client.delete(
        api_key=config.LABEL_STUDIO_API_KEY,
        api=f"/projects/{project_id}",
    )


def delete_all_projects():
    print("INFO: Deleting all projects")
    try:
        projects = list_projects()
        for project in projects["results"]:
            print(f"INFO: Deleting project {project['id']}")
            delete_project(project["id"])
    except Exception as e:
        print(e)
        return {"error": str(e)}
