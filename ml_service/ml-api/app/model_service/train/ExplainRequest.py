from typing import Optional, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, File, Form, UploadFile


class BaseExplainRequest(BaseModel):
    userEmail: str = Field(default="test-automl", title="userEmail without @")
    projectName: str = Field(default="pet-finder", title="Project name")
    runName: str = Field(default="ISE", title="Run name")


# not use for now
class TextExplainRequest(BaseExplainRequest):
    text: str = Field(
        default="This is a sample text",
        title="texts to explain",
    )


class ImageExplainRequest(BaseExplainRequest):
    images: List[UploadFile] = Field(
        default="",
        title="images to explain",
    )

