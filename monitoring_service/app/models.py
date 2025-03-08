from pydantic import BaseModel



class Item(BaseModel):
    id: int
    name: str
    price: float


class DetectDriftRequest(BaseModel):
    reference_data_url: str
    current_data_url: str
    drift_threshold: float = 0.05
    label_column: str = "label"
