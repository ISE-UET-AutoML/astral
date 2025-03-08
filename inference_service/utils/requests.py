from pydantic import BaseModel, Field, ConfigDict
from pathlib import Path
from typing import List, Annotated
from bentoml.validators import ContentType



class BaseRequest(BaseModel):
    userEmail: str = Field(description="User Email")
    projectName: str = Field(description="Project name")
    runName: str = Field(description="Run name")
    task: str = Field(description="task to be performed")
    task_id: str = Field(description="Task ID")

class DeployRequest(BaseRequest):
    task: str = Field(description="task to be performed", default="IMAGE_CLASSIFICATION")

# IMAGE CLASSIFICATION
class ImagePredictionRequest(BaseRequest):
    images: List[str] = Field(description="Image file paths")

# IMAGE CLASSIFICATION
class ImageEvaluateRequest(BaseRequest):
    image_file_path: str = Field(description="url to csv that contain file paths")
    image_col: str = Field(description="column name that contain file paths")

class ImageExplainRequest(BaseRequest):
    image: str = Field(description="Image file path")
    method: str = Field(description="Method to explain the image", default="lime")


# TEXT CLASSIFICATION
class TextPredictionRequest(BaseRequest):
    text_file_path: str = Field(description="Text file path", default="text.csv")
    text_col: str = Field(description="text column in the text file", default=None)

class TextExplainRequest(BaseRequest):
    text: str = Field(description="text to explained")
    method: str = Field(description="Method to explain the text", default="shap")


# TABULAR CLASSIFICATION
class TabularPredictionRequest(BaseRequest):
    tab_file_path: str = Field(description="Tabular file path", default="text.csv")

class TabularExplainRequest(BaseRequest):
    tab_explain_file_path: str = Field(description="text to explained")
    method: str = Field(description="Method to explain the text", default="shap")

class TabularPredictionToCSVRequest(BaseRequest):
    tab_file_path: str = Field(description="Tabular file path", default="text.csv")
    columns_to_keep: List[str] = Field(description="columns to keep in the csv file", default=None)

    

class MultiModalPredictionRequest(BaseRequest):
    tab_file_path: str = Field(description="csv file path", default="text.csv")
    column_types: dict = Field(description="column types", default=None)
    
    

class MultiModalExplainRequest(BaseRequest):
    tab_explain_file_path: str = Field(description="text to explained")
    method: str = Field(description="Method to explain the text", default="shap")
    column_types: dict = Field(description="column types", default=None)