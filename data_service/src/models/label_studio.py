from typing import Optional, Sequence
from pydantic import BaseModel, Field


class TaskImportRequest(BaseModel):
    attribute_type: dict = Field(
        {
            "image_col1": "IMG",
            "image_col2": "IMG",
            "text_column": "TXT",
        }
    )
    data: list[dict] = Field([])
    label_field: str | Sequence[str] | None = Field(["label"])


class AnnotateRequest(BaseModel):
    choice: str | None = Field(None)
    bbox: list[dict] | None = Field(None)
    ml_model: str = Field(
        default="undefined_model",
        description="ml model version/name that create the prediction, dont need to specify if you use set annotation api",
    )


class LabelConfigRequest(BaseModel):
    label_choices: Optional[list[str]] = Field(["0", "1"])
