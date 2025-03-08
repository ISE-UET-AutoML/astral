from typing import Optional
from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    userEmail: str = Field(default="test-automl", title="userEmail without @")
    projectName: str = Field(default="pet-finder", title="Project name")
    runName: str = Field(default="ISE", title="Run name")
    dataset: dict = Field(
        default={
            "dataset_url": "",
            "gcloud_dataset_bucketname": "",
            "gcloud_dataset_directory": "",
            "dataset_download_method": "gdrive",
        }
    )
    predict_file: str | None = Field(
        default="test.csv",
        title="Predict filename",
        description="Predict filename, if none, the system will find any file with .csv extension",
    )

    evaluate: bool = Field(
        default=False,
        title="Evaluate",
        description="if predict_file has label column, this will evaluate the model",
    )


class GenericMultiModalPredictRequest(PredictRequest):
    image_cols: list[str] = Field(
        default=["image"],
        title="Image columns",
    )
