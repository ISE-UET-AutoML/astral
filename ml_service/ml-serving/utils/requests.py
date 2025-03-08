from pydantic import BaseModel, Field, ConfigDict
from pathlib import Path
from typing import List, Annotated
from bentoml.validators import ContentType



class BaseRequest(BaseModel):
    model_config = ConfigDict(
        extra='allow',
    )
    userEmail: str = Field(description="User Email")
    projectName: str = Field(description="Project name")
    runName: str = Field(description="Run name")
    task: str = Field(description="task to be performed")

class DeployRequest(BaseRequest):
    task: str = Field(description="task to be performed", default="IMAGE_CLASSIFICATION")

# IMAGE CLASSIFICATION
class ImagePredictionRequest(BaseRequest):
    images: List[str] = Field(description="Image file paths")
    task: str = Field(description="task to be performed", default="IMAGE_CLASSIFICATION")
    
class ImageExplainRequest(BaseRequest):
    image: str = Field(description="Image file path")
    method: str = Field(description="Method to explain the image", default="lime")
    task: str = Field(description="task to be performed", default="IMAGE_CLASSIFICATION")


# TEXT CLASSIFICATION
class TextPredictionRequest(BaseRequest):
    text_file_path: str = Field(description="Text file path", default="text.csv")
    text_col: str = Field(description="text column in the text file", default=None)
    task: str = Field(description="task to be performed", default="TEXT_CLASSIFICATION")

class TextExplainRequest(BaseRequest):
    text: str = Field(description="text to explained")
    method: str = Field(description="Method to explain the text", default="lime")
    task: str = Field(description="task to be performed", default="TEXT_CLASSIFICATION")


# TABULAR CLASSIFICATION
class TabularPredictionRequest(BaseRequest):
    tab_file_path: str = Field(description="Tabular file path", default="text.csv")

class TabularExplainRequest(BaseRequest):
    tab_explain_file_path: str = Field(description="text to explained")
    method: str = Field(description="Method to explain the text", default="lime")
    

class MultiModalPredictionRequest(BaseRequest):
    tab_file_path: str = Field(description="csv file path", default="text.csv")
    column_types: dict = Field(description="column types", default=None)
    
    

class MultiModalExplainRequest(BaseRequest):
    tab_explain_file_path: str = Field(description="text to explained")
    method: str = Field(description="Method to explain the text", default="lime")
    column_types: dict = Field(description="column types", default=None)