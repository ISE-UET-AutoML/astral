import json
from math import e
from uuid import uuid4

from fastapi import HTTPException
from label_studio_sdk import ExportCreate, TaskFilterOptions

from settings import config
from label_studio_sdk.label_interface import LabelInterface
from label_studio_sdk.label_interface.objects import AnnotationValue
from settings.config import label_studio_client
from settings.config import label_studio_sdk_client
import label_studio_sdk.data_manager as ls_dm
from models.label_studio import AnnotateRequest, TaskImportRequest
from . import project as project_service


def get_project(task_id):
    task = label_studio_sdk_client.tasks.get(id=task_id)
    return project_service.get_project(task.project)


def import_tasks( 
    project_id, import_request: TaskImportRequest, use_predictions_as_annotations=True
):
    data_prefix = config.constants.data_prefix
    dataset_with_label = []
    dataset_without_label = []
    
    for task in import_request.data:
        data = {}

        for k, v in task.items():
            if k == "label":
                data[f"label"] = v
                continue
            if k not in import_request.attribute_type:
                import_request.attribute_type[k] = "VAL"

            type = import_request.attribute_type[k]
            data[f"{data_prefix}-{type}-{k}"] = v

        data["temp-col-for-any-data"] = "temp"

        if "label" in data:
            dataset_with_label.append(data)
        else:
            dataset_without_label.append(data)

    # print(prefixed_dataset)

    # * Import tasks -----------------------------------------------------------
    if dataset_with_label.__len__() != 0:
        res1 = dict(
            label_studio_sdk_client.projects.import_tasks(
                id=project_id,
                request=dataset_with_label,
                preannotated_from_fields=import_request.label_field,
                commit_to_project=True,
            )
        )
    else:
        res1 = {}
    if dataset_without_label.__len__() != 0:
        res2 = dict(
            label_studio_sdk_client.projects.import_tasks(
                id=project_id,
                request=dataset_without_label,
                commit_to_project=True,
            )
        )
    else:
        res2 = {}
    # * Set predictions as annotations -----------------------------------------
    filter = ls_dm.Filters().create(  # filter out tasks with annotations
        conjunction="and",
        items=[
            ls_dm.Filters.item(
                name=ls_dm.Column.total_annotations,
                operator=ls_dm.Operator.EQUAL,
                column_type=ls_dm.Type.Number,
                value=ls_dm.Filters.value(0),
            ),
        ],
    )
    if use_predictions_as_annotations:
        label_studio_sdk_client.actions.create(
            id="predictions_to_annotations",
            project=project_id,
            filters=filter,
            ordering=[],
            selected_items={"all": True, "excluded": []},
        )
    return {
        "import labeled": res1,
        "import unlabeled": res2,
    }


def export_for_training(project_id, exclude_non_annotated):
    bytes = list(
        label_studio_sdk_client.projects.exports.create_export(
            id=project_id,
            export_type="JSON_MIN",
            download_all_tasks=False,
        )
    )
    str_list = [byte.decode("utf-8") for byte in bytes]

    data = "".join(str_list)
    # print(data)
    data = json.loads(data)
    res = {}
    res["data"] = [  # filter out None values
        {
            k: v
            for k, v in dict(task).items()
            if v is not None
            and (str(k).startswith(config.constants.data_prefix) or k == "label")
        }
        for task in data
    ]

    return res


def export_for_preview(project_id, page, page_size):
    bytes = list(
        label_studio_sdk_client.projects.exports.create_export(
            id=project_id,
            export_type="JSON_MIN",
            download_all_tasks=False,
        )
    )
    str_list = [byte.decode("utf-8") for byte in bytes]

    data = "".join(str_list)
    # print(data)
    data: list = json.loads(data)

    res = {}
    res["project_info"] = project_service.get_label_config(project_id)

    total = data.__len__()

    if page_size * (page - 1) >= total:
        page = 1

    start = page_size * (page - 1)
    end = min(page_size * page, total)
    data = data[start:end]

    res["meta"] = {}
    res["meta"]["page"] = page
    res["meta"]["page_size"] = page_size
    res["meta"]["start"] = start
    res["meta"]["end"] = end - 1
    res["meta"]["total"] = total

    res["data"] = [  # filter out None values
        {
            k: v
            for k, v in dict(task).items()
            if v is not None
            and (str(k).startswith(config.constants.data_prefix) or k == "label")
        }
        for task in data
    ]

    return res


def export_labeling_jobs(project_id, batch_size=50):
    """
    Export labeling jobs for a project
    """
    filter = ls_dm.Filters().create(
        conjunction=ls_dm.Filters.AND,
        items=[
            ls_dm.Filters.item(
                name=ls_dm.Column.total_annotations,
                operator=ls_dm.Operator.EQUAL,
                column_type=ls_dm.Type.Number,
                value=ls_dm.Filters.value(0),
            ),
        ],
    )
    view = label_studio_sdk_client.views.create(
        project=project_id, data={"title": "Tasks Sample", "filters": filter}
    )
    tasks = label_studio_sdk_client.tasks.list(
        view=view.id,
        fields="all",
        page_size=batch_size,
        include=["id", "data", "predictions"],
    )
    # for task in tasks:
    #     print(dict(task))

    res = {}
    res["project_info"] = project_service.get_label_config(project_id)
    res["meta"] = {}
    res["meta"]["batch_size"] = batch_size
    res["tasks"] = [  # filter out None values
        {
            "id": task.id,
            "predictions": task.predictions,
            "data": {
                k: v
                for k, v in dict(task)["data"].items()
                if v is not None and (str(k).startswith(config.constants.data_prefix))
            },
        }
        for task in tasks
    ]

    return res


def has_unannotated_tasks(project_id):
    filter = ls_dm.Filters().create(
        conjunction=ls_dm.Filters.AND,
        items=[
            ls_dm.Filters.item(
                name=ls_dm.Column.total_annotations,
                operator=ls_dm.Operator.EQUAL,
                column_type=ls_dm.Type.Number,
                value=ls_dm.Filters.value(0),
            ),
        ],
    )
    view = label_studio_sdk_client.views.create(
        project=project_id, data={"title": "Tasks Sample", "filters": filter}
    )
    tasks = label_studio_sdk_client.tasks.list(
        view=view.id,
        fields="all",
        page_size=1,
        include=["id"],
    )
    for task in tasks:
        return True
    return False
    # print(tasks)


def export_snapshot(project_id, page, page_size, exclude_non_annotated):
    # TODO export for large datasets
    pass


def export_ten(project_id, page, page_size, exclude_non_annotated):
    bytes = list(
        label_studio_sdk_client.projects.exports.create_export(
            id=project_id,
            export_type="JSON_MIN",
            download_all_tasks=not exclude_non_annotated,
        )
    )

    str_list = [byte.decode("utf-8", errors="ignore") for byte in bytes]

    data = "".join(str_list)
    # print(data)
    data = json.loads(data)
    res = {}
    res["project_info"] = project_service.get_label_config(project_id)
    res["project_info"]["has_unannotated_tasks"] = has_unannotated_tasks(project_id)

    total = data.__len__()

    if page_size * (page - 1) >= total:
        page = 1

    start = page_size * (page - 1)
    end = min(page_size * page, total)
    data = data[start:end]

    res["meta"] = {}
    res["meta"]["page"] = page
    res["meta"]["page_size"] = page_size
    res["meta"]["start"] = start
    res["meta"]["end"] = end - 1
    res["meta"]["total"] = total

    res["tasks"] = []  # filter out None values

    for task in data:
        res["tasks"].append(
            {
                "id": task["id"],
                "data": {
                    k: v
                    for k, v in task.items()
                    if v is not None
                    and (
                        str(k).startswith(config.constants.data_prefix) or k == "label"
                    )
                },
            }
        )

    return res

def export_all(project_id, exclude_non_annotated):

    bytes = list(
        label_studio_sdk_client.projects.exports.create_export(
            id=project_id,
            export_type="JSON_MIN",
            download_all_tasks=not exclude_non_annotated,
        )
    )

    str_list = [byte.decode("utf-8", errors="ignore") for byte in bytes]
    data = "".join(str_list)
    data = json.loads(data)

    res = {}
    res["project_info"] = project_service.get_label_config(project_id)
    res["project_info"]["has_unannotated_tasks"] = has_unannotated_tasks(project_id)

    total = len(data)

    res["meta"] = {
        "total": total
    }

    res["tasks"] = [
        {
            "id": task["id"],
            "data": {
                k: v
                for k, v in task.items()
                if v is not None
                and (str(k).startswith(config.constants.data_prefix) or k == "label")
            },
        }
        for task in data
    ]

    return res

def create_or_update_anotations(task_id, anotation: AnnotateRequest):
    existing_anotation = label_studio_sdk_client.annotations.list(id=task_id)
    if existing_anotation.__len__() == 0:
        return create_anotations(task_id, anotation)
    else:
        return update_anotations(task_id, existing_anotation[0].id, anotation)


def create_or_update_predictions(task_id, prediction: AnnotateRequest):
    create_predictions(task_id, prediction)  # always create new predictions
    # existing_prediction = label_studio_sdk_client.predictions.list(task=task_id)
    # print(existing_prediction)
    # if existing_prediction.__len__() == 0:
    #     return create_predictions(task_id, prediction)
    # else:
    #     return update_predictions(task_id, existing_prediction[0].id, prediction)


def create_anotations(task_id, anotation: AnnotateRequest):
    project = get_project(task_id)
    if project["description"].__contains__("CLASSIFICATION"):
        label_interface = LabelInterface(project["label_config"])
        # * Validate annotation ------------------------------------------------
        if anotation.choice not in label_interface.get_control("label").labels:
            raise HTTPException(
                status_code=400,
                detail=f'Label "{anotation.choice}" not in project labels: {label_interface.get_control("label").labels}',
            )
        # * Create annotation -------------------------------------------------
        res = label_studio_sdk_client.annotations.create(
            id=task_id,
            result=[
                {
                    "from_name": "label",
                    "to_name": "temp-col-for-any-data",
                    "type": "choices",
                    "value": {"choices": [anotation.choice]},
                }
            ],
            was_cancelled=False,
            ground_truth=True,
        )
        return dict(res)

    else:
        raise HTTPException(
            status_code=400,
            detail=f'Project type "{project["description"]}" not supported',
        )


def update_anotations(task_id, anotation_id, anotation: AnnotateRequest):
    project = get_project(task_id)
    if project["description"].__contains__("CLASSIFICATION"):
        label_interface = LabelInterface(project["label_config"])
        # * Validate annotation ------------------------------------------------
        if anotation.choice not in label_interface.get_control("label").labels:
            raise HTTPException(
                status_code=400,
                detail=f'Label "{anotation.choice}" not in project labels: {label_interface.get_control("label").labels}',
            )
        # * Update annotation -------------------------------------------------
        res = label_studio_sdk_client.annotations.update(
            id=anotation_id,
            result=[
                {
                    "from_name": "label",
                    "to_name": "temp-col-for-any-data",
                    "type": "choices",
                    "value": {"choices": [anotation.choice]},
                }
            ],
            was_cancelled=False,
            ground_truth=True,
        )
        return dict(res)

    else:
        raise HTTPException(
            status_code=400,
            detail=f'Project type "{project["description"]}" not supported',
        )


def create_predictions(task_id, anotation: AnnotateRequest):
    project = get_project(task_id)
    if project["description"].__contains__("CLASSIFICATION"):
        label_interface = LabelInterface(project["label_config"])
        # * Validate annotation ------------------------------------------------
        if anotation.choice not in label_interface.get_control("label").labels:
            raise HTTPException(
                status_code=400,
                detail=f'Label "{anotation.choice}" not in project labels: {label_interface.get_control("label").labels}',
            )
        # * Create annotation -------------------------------------------------
        res = label_studio_sdk_client.predictions.create(
            task=task_id,
            result=[
                {
                    "from_name": "label",
                    "to_name": "temp-col-for-any-data",
                    "type": "choices",
                    "value": {"choices": [anotation.choice]},
                }
            ],
            model_version=anotation.ml_model,
        )
        return dict(res)

    else:
        raise HTTPException(
            status_code=400,
            detail=f'Project type "{project["description"]}" not supported',
        )


def update_predictions(task_id, anotation_id, anotation: AnnotateRequest):
    project = get_project(task_id)
    if project["description"].__contains__("CLASSIFICATION"):
        label_interface = LabelInterface(project["label_config"])
        # * Validate annotation ------------------------------------------------
        if anotation.choice not in label_interface.get_control("label").labels:
            raise HTTPException(
                status_code=400,
                detail=f'Label "{anotation.choice}" not in project labels: {label_interface.get_control("label").labels}',
            )
        # * Update annotation -------------------------------------------------
        res = label_studio_sdk_client.predictions.update(
            id=anotation_id,
            result=[
                {
                    "from_name": "label",
                    "to_name": "temp-col-for-any-data",
                    "type": "choices",
                    "value": {"choices": [anotation.choice]},
                }
            ],
            model_version=anotation.ml_model,
        )
        return dict(res)

    else:
        raise HTTPException(
            status_code=400,
            detail=f'Project type "{project["description"]}" not supported',
        )


def delete_all_tasks(project_id):
    try:
        label_studio_sdk_client.actions.create(
            id="delete_tasks",
            project=project_id,
            selected_items={"all": True, "excluded": []},
        )
    except Exception as e:
        print(e)
        raise HTTPException(status_code=400, detail="Failed to delete tasks")
    return {"message": "All tasks deleted"}


def delete_tasks(project_id, tasks: list):
    try:
        label_studio_sdk_client.actions.create(
            id="delete_tasks",
            project=project_id,
            selected_items={"all": False, "included": tasks},
        )
    except Exception as e:
        print(e)
        raise HTTPException(status_code=400, detail="Failed to delete tasks")
    return {"message": "Tasks deleted"}

# import pandas as pd
# import os
# from typing import List, Dict, Any
# import json
# import logging
# import pprint

# # Set up logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# def export_label_studio_to_csv(
#     # label_studio_client,
#     project_id,
#     export_dir: str = "/drive2/tuananhtd/automl/data_service/export"
# ) -> Dict[str, Any]:
#     """
#     Export dữ liệu từ Label Studio project thành file CSV
   
#     Args:
#         label_studio_client: Instance của LabelStudioClient
#         project_id: ID của project cần export
#         export_dir: Thư mục để lưu file CSV
    
#     Returns:
#         Dict[str, Any]: Response dictionary containing status, message, and file path
#     """
#     try:
#         # Tạo thư mục export nếu chưa tồn tại
#         os.makedirs(export_dir, exist_ok=True)
       
#         # Đường dẫn output file CSV
#         output_path = os.path.join(export_dir, f"project_{project_id}_export.csv")
        
#         # Kiểm tra label_studio_client
#         if not label_studio_client:
#             raise ValueError("Label Studio client is required")
            
#         # Gọi API để lấy tất cả các tasks từ project
#         logger.info(f"Fetching tasks for project {project_id}")
#         response = label_studio_client.get(
#             api_key=label_studio_client.default_api_key,
#             api=f"http://127.0.0.1:10053//projects/{project_id}/tasks"
#         )
        
#         # Log the raw response for debugging
#         logger.info("Raw API response type: %s", type(response))
#         logger.info("Raw API response: %s", pprint.pformat(response))
        
#         # Handle different response formats
#         tasks = response
#         if isinstance(response, str):
#             try:
#                 tasks = json.loads(response)
#                 logger.info("Successfully parsed string response as JSON")
#             except json.JSONDecodeError as e:
#                 logger.error(f"Failed to parse response as JSON: {e}")
#                 return {"status": "error", "message": "Invalid JSON response from API"}
        
#         # Log the structure after potential JSON parsing
#         logger.info("Response structure after parsing: %s", pprint.pformat(tasks))
        
#         # Handle potential dictionary response with tasks inside
#         if isinstance(tasks, dict):
#             logger.info("Response is a dictionary. Available keys: %s", list(tasks.keys()))
#             if "tasks" in tasks:
#                 tasks = tasks["tasks"]
#                 logger.info("Found tasks under 'tasks' key")
#             elif "results" in tasks:
#                 tasks = tasks["results"]
#                 logger.info("Found tasks under 'results' key")
#             elif "error" in tasks:
#                 logger.error(f"API returned error: {tasks['error']}")
#                 return {"status": "error", "message": f"API error: {tasks['error']}"}
#             else:
#                 # Try to handle Label Studio's specific response format
#                 try:
#                     # If we have a valid task-like structure, treat the dict itself as a task
#                     if all(key in tasks for key in ["id", "data"]):
#                         tasks = [tasks]
#                         logger.info("Treating single task response as a list")
#                     else:
#                         logger.error("Unexpected dictionary format. Keys: %s", list(tasks.keys()))
#                         return {"status": "error", "message": "Unexpected API response format"}
#                 except Exception as e:
#                     logger.error(f"Error processing dictionary response: {str(e)}")
#                     return {"status": "error", "message": "Failed to process API response"}
                
#         # Validate tasks is a list
#         if not isinstance(tasks, list):
#             logger.error(f"Expected list of tasks, got type {type(tasks)}")
#             return {"status": "error", "message": "Invalid task list format"}
            
#         logger.info(f"Processing {len(tasks)} tasks")
        
#         # Danh sách để lưu dữ liệu
#         rows = []
#         for task_index, task in enumerate(tasks):
#             try:
#                 # Log the current task for debugging
#                 logger.debug(f"Processing task {task_index}: {pprint.pformat(task)}")
                
#                 # Đảm bảo task là dictionary
#                 if isinstance(task, str):
#                     task = json.loads(task)
                    
#                 if not isinstance(task, dict):
#                     logger.warning(f"Skipping invalid task at index {task_index}: {type(task)}")
#                     continue
                    
#                 raw_data = task.get("data", {})
#                 logger.debug(f"Raw data for task {task_index}: {pprint.pformat(raw_data)}")
                
#                 # Đảm bảo raw_data là dictionary
#                 if isinstance(raw_data, str):
#                     raw_data = json.loads(raw_data)
                    
#                 if not isinstance(raw_data, dict):
#                     logger.warning(f"Invalid raw_data format for task {task_index}, using empty dict")
#                     raw_data = {}
                    
#                 if "annotations" in task and task["annotations"]:
#                     for annotation in task["annotations"]:
#                         row_data = {
#                             "annotation_id": annotation.get("id", ""),
#                             "annotator": annotation.get("completed_by", {}).get("email", "1"),
#                             "created_at": annotation.get("created_at", ""),
#                             "updated_at": annotation.get("updated_at", ""),
#                             "id": task.get("id", ""),
#                             "lead_time": annotation.get("lead_time", ""),
#                             "temp-col-for-any-data": "temp",
#                         }
#                         # Thêm các trường data-VAL-*
#                         for key, value in raw_data.items():
#                             row_data[f"data-VAL-{key}"] = str(value).strip()
#                         rows.append(row_data)
#                 else:
#                     row_data = {
#                         "annotation_id": "",
#                         "annotator": "1",
#                         "created_at": task.get("created_at", ""),
#                         "updated_at": task.get("updated_at", ""),
#                         "id": task.get("id", ""),
#                         "lead_time": "",
#                         "temp-col-for-any-data": "temp",
#                     }
#                     for key, value in raw_data.items():
#                         row_data[f"data-VAL-{key}"] = str(value).strip()
#                     rows.append(row_data)
                    
#             except Exception as e:
#                 logger.error(f"Error processing task at index {task_index}: {str(e)}")
#                 continue
                
#         if not rows:
#             logger.warning("No data to export")
#             return {"status": "warning", "message": "No data available to export"}
            
#         # Tạo DataFrame
#         df = pd.DataFrame(rows)
        
#         # Sắp xếp lại thứ tự cột
#         columns_order = ["annotation_id", "annotator", "created_at"]
#         data_val_columns = sorted([col for col in df.columns if col.startswith("data-VAL-")])
#         columns_order.extend(data_val_columns)
#         remaining_columns = ["id", "lead_time", "temp-col-for-any-data", "updated_at"]
#         columns_order.extend(remaining_columns)
        
#         # Sắp xếp lại DataFrame
#         df = df[columns_order]
#         df.to_csv(output_path, index=False, encoding="utf-8")
        
#         logger.info(f"Successfully exported {len(rows)} rows to {output_path}")
#         return {
#             "status": "success",
#             "message": f"Exported {len(rows)} rows to {output_path}",
#             "file_path": output_path
#         }
        
#     except Exception as e:
#         logger.error(f"Unexpected error during export: {str(e)}")
#         return {
#             "status": "error",
#             "message": f"Export failed: {str(e)}"
#         }