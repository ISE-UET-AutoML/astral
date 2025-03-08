from fastapi import APIRouter, Body, Request
from service.label_studio import project as project_service
from models.label_studio import LabelConfigRequest

router = APIRouter()


@router.get("/")
def list_projects():
    return project_service.list_projects()


@router.get("/{project_id}")
def get_project(project_id: str):
    return project_service.get_project(project_id)


@router.post("/create")
def create_project(
    project_name: str = Body(...), project_type: str = Body("CLASSIFICATION")
):
    return project_service.create_project(
        project_name, project_description=project_type, project_type=project_type
    )


@router.post("/{project_id}/set_label_config")
def set_label_config(project_id: str, label_config_args: LabelConfigRequest):
    return project_service.update_label_config(project_id, label_config_args)


@router.get("/{project_id}/get_label_config")
def get_label_config(project_id: str):
    return project_service.get_label_config(project_id)


@router.delete("/delete_all")
def delete_all_projects():
    return project_service.delete_all_projects()


@router.delete("/{project_id}")
def delete_project(project_id: str):
    return project_service.delete_project(project_id)


@router.post("/update")
def update_project():
    pass
