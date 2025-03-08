from typing import Optional
from pydantic import BaseModel, Field


class MlResult(BaseModel):
    task_id: str
    status: dict = None
    time: dict = None
    error: Optional[str] = None


class SimpleTrainRequest(BaseModel):
    userEmail: str = Field(default="test-automl", title="userEmail without @")
    projectId: str = Field(default="66aa68b3015d0ebc8b61cc76", title="Project name")
    ds_projectId: str = Field(default="", title="Data service project id")
    runName: str = Field(default="ISE", title="Run name")
    training_time: int = Field(default=60, title="Training Time")
    presets: str = Field(default="medium_quality", title="Presets")


class TrainRequest(BaseModel):
    userEmail: str = Field(default="test-automl", title="userEmail without @")
    projectName: str = Field(default="titanic", title="Project name")
    training_time: int = Field(default=60, title="Training Time")
    runName: str = Field(default="ISE", title="Run name")
    presets: str = Field(default="medium_quality", title="Presets")
    dataset_url: str = Field(
        default="1yIkh7Wvu4Lk1o6gVIuyXTb3l9zwNXOCE", title="Dataset URL"
    )
    gcloud_dataset_bucketname: str = Field(title="gcloud dataset bucketname")
    gcloud_dataset_directory: str = Field(title="gcloud dataset directory")
    dataset_download_method: str = Field(
        default="gdrive",
        title="Dataset download method",
        description="if 'gdrive', dataset url is an id\n",
    )
    label_column: str = Field(default="label")
    training_argument: dict = Field(
        default={
            # "data_args": {},
            # "ag_model_args": {},
            "ag_fit_args": {
                "time_limit": 60,
            },
        },
        title="Training arguments.",
    )

class TabularTrainRequest(TrainRequest):
    presets: str | list[str] = Field(default="good_quality", title="Presets")
    label_column: str = Field(
        default="Survived", description="Survived for titanic dataset"
    )


from dataclasses import dataclass


@dataclass
class Timm_Checkpoint:
    swin_small_patch4_window7_224: str = "swin_small_patch4_window7_224"
    swin_base_patch4_window7_224: str = "swin_base_patch4_window7_224"
    swin_large_patch4_window7_224: str = "swin_large_patch4_window7_224"
    swin_large_patch4_window12_384: str = "swin_large_patch4_window12_384"


class ImageClassifyTrainRequest(TrainRequest):
    training_argument: dict = Field(
        default={
            "data_args": {},
            "ag_model_args": {
                "pretrained": True,
                "hyperparameters": {
                    "model.timm_image.checkpoint_name": Timm_Checkpoint.swin_small_patch4_window7_224,
                },
            },
            "ag_fit_args": {
                "time_limit": 60,
                "hyperparameters": {"env.per_gpu_batch_size": 4, "env.batch_size": 4},
            },
        },
        title="Training arguments.",
    )


class ObjectDetectionTrainRequest(TrainRequest):
    projectName: str = Field(default="mini-motobike", title="Project name")


class ImageSegmentationTrainRequest(TrainRequest):
    image_cols: list[str] = Field(
        default=["image", "label"],
        title="Image column",
        description="List of image columns, used to expand image path",
    )


class GenericMultiModalTrainRequest(TrainRequest):
    problem_type: str | None = Field(default=None, title="Problem type")
    image_cols: list[str] = Field(
        default=["image"],
        title="Image column",
        description="List of image columns, used to expand image path",
    )
    metrics: str | list[str] | None = Field(default=None, title="Metrics")


class NamedEntityRecognitionTrainRequest(TrainRequest):
    image_cols: list[str] = Field(
        default=[],
        title="Image column",
        description="List of image columns, used to expand image path",
    )


class TTSemanticMatchingTrainRequest(TrainRequest):
    query_col: str = Field(default="premise", title="first text column")
    response_col: str = Field(default="hypothesis", title="second text column")
    match_label: int = Field(
        default=1,
        title="the label indicating that query and response have the same semantic meanings.",
    )


class TimeSeriesTrainRequest(TrainRequest):
    prediction_length: int = Field(
        default=48,
        title="Prediction length",
        description="The number of time steps ahead to predict",
    )
    id_col: str = Field(
        default="item_id",
        title="ID column",
    )
    timestamp_col: str = Field(
        default="timestamp",
        title="Timestamp column",
    )
    known_covariates: list[str] = Field(
        default=[],
        description="known covariates column in train dataset, if a column is not in known_covariates, it will be interpreted as past covariates",
    )


class InstanceInfo(BaseModel):
    id: int
    ssh_port: str
    public_ip: str
    deploy_port: str

class CloudTrainRequest(BaseModel):
    username: str
    dataset_url: str
    dataset_label_url: str
    task: str
    project_id: str
    training_time: int = 60
    presets: str = "high_quality"
    instance_info: InstanceInfo
    target_column: Optional[str] = "label"
    image_column: Optional[str] = None


class CloudDeployRequest(BaseModel):
    username: str
    task: str
    task_id: str
    project_id: str
    deploy_type: str = "REALTIME"
    instance_info: InstanceInfo
    

class TrainingProgressRequest(BaseModel):
    task_id: str
    instance_info: InstanceInfo
    

class DeployProgressRequest(BaseModel):
    task_id: str
    instance_info: InstanceInfo