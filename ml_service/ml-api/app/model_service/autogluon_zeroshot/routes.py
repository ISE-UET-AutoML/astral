from fastapi import APIRouter, Body, Query, UploadFile, File
from autogluon.multimodal import MultiModalPredictor
from pydantic import BaseModel, Field
from settings.config import TEMP_DIR
import os
from pathlib import Path
import numpy as np

router = APIRouter()


@router.post(
    "/image_prediction",
    description=(
        "List of labels to classify the image.\n"
        "If there is only one label, this will return the similarity between the label and the image"
    ),
)
async def image_classify(
    image: UploadFile = File(...),
    label: list[str] = Query([]),
):
    print("Zeroshot image prediction request received")
    if label.__len__() == 0:
        return {"status": "ERROR", "message": "Label(s) is required"}

    temp_image_path = f"{TEMP_DIR}//temp.jpg"
    os.makedirs(Path(temp_image_path).parent, exist_ok=True)
    with open(temp_image_path, "wb") as buffer:
        buffer.write(await image.read())

    np.set_printoptions(threshold=np.inf)

    if label.__len__() == 1:
        predictor = MultiModalPredictor(
            query="abc",
            response="xyz",
            problem_type="image_text_similarity",
        )
        proba = predictor.predict_proba({"abc": [temp_image_path], "xyz": [label[0]]})
        return {"status": "SUCCESS", "proba": str(proba), "results": float(proba[0][1])}

    # Image classification
    predictor = MultiModalPredictor(problem_type="zero_shot_image_classification")
    proba = predictor.predict_proba({"image": [temp_image_path]}, {"text": label})
    results = np.argmax(proba, axis=1)
    results = label[results[0]]

    return {"status": "SUCCESS", "proba": str(proba), "results": results}
