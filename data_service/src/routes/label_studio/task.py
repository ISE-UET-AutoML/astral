from re import T
from typing import Optional
from fastapi import APIRouter, Body, Form, Query
from httpx import delete

from service.label_studio import tasks as task_service
from models.label_studio import AnnotateRequest, TaskImportRequest

router = APIRouter()


@router.post("/import/{project_id}")
def import_tasks(project_id: str, data: TaskImportRequest):
    return task_service.import_tasks(
        project_id,
        data,
    )


@router.get("/{project_id}/export_for_training")
def export_tasks(project_id: str, exclude_non_annotated: Optional[bool] = True):
    return task_service.export_for_training(project_id, exclude_non_annotated)


@router.get("/{project_id}/export_for_labeling")
def export_labeling_jobs(project_id: str, batch_size: Optional[int] = Query(50)):
    return task_service.export_labeling_jobs(project_id, batch_size)


# @router.get("/{project_id}/export_for_preview")
def export_for_preview(
    project_id: str,
    page: Optional[int] = Query(1),
    page_size: Optional[int] = Query(12),
):
    return task_service.export_for_preview(project_id, page, page_size)


@router.get("/{project_id}/export_ten")
def export_ten(
    project_id: str,
    page: Optional[int] = Query(1),
    page_size: Optional[int] = Query(100),
    exclude_non_annotated: Optional[bool] = Query(True),
):
    return task_service.export_ten(project_id, page, page_size, exclude_non_annotated)
    
@router.get("/{project_id}/export_all")
def export_all(
    project_id: str,
    exclude_non_annotated: Optional[bool] = Query(True),
):
    return task_service.export_all(project_id, exclude_non_annotated)



@router.post("/{task_id}/set_annotation")
def set_annotation(task_id: str, annotation: AnnotateRequest):
    return task_service.create_or_update_anotations(task_id, annotation)


@router.post("/{task_id}/set_prediction")
def set_prediction(task_id: str, prediction: AnnotateRequest):
    return task_service.create_or_update_predictions(task_id, prediction)


@router.delete("/{project_id}/delete_all_tasks")
def delete_all_tasks(project_id: str):
    return task_service.delete_all_tasks(project_id)


@router.delete("/{project_id}/")
def delete_tasks(
    project_id: str,
    tasks=Body(
        default={"tasks": []},
    ),
):
    return task_service.delete_tasks(project_id, tasks)
