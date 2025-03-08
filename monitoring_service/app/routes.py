from fastapi import APIRouter, HTTPException
from app.models import Item
from app.models import DetectDriftRequest

import pandas as pd
from evidently.report import Report
from evidently.metric_preset import DataDriftPreset
import zipfile
import requests
import io
import json

router = APIRouter()

TARGET_CSV = "train.csv"


@router.post("/detect_drift", response_model=dict)
async def detect_drift(req: DetectDriftRequest):

    # Stream the ZIP file from the URL
    response = requests.get(req.reference_data_url, stream=True)
    if response.status_code != 200:
        raise ValueError("❌ Failed to download ZIP file")

    # Load ZIP into memory
    zip_file = zipfile.ZipFile(io.BytesIO(response.content))

    # Check if train.csv exists
    if TARGET_CSV not in zip_file.namelist():
        raise ValueError(f"❌ {TARGET_CSV} not found in ZIP")

    # Read train.csv directly into Pandas
    with zip_file.open(TARGET_CSV) as file:
        reference_data = pd.read_csv(file)

    current_data = pd.read_csv(req.current_data_url)
    
    reference_data.drop(columns=[req.label_column], inplace=True)

    try:
        reference_data.drop(columns=["id"], inplace=True)
    except KeyError:
        print("No id column to delete")
        pass

    try:
        current_data.drop(columns=["id"], inplace=True)
    except KeyError:
        print("No id column to delete")
        pass

    print(f"✅ Loaded CSV: {TARGET_CSV}")
    print(reference_data.head())
    print(current_data.head())

    data_drift_report = Report(metrics=[
        DataDriftPreset(),
    ])

    data_drift_report.run(current_data=current_data, reference_data=reference_data, column_mapping=None)
    data_drift_report.json()
    with open("data_drift_report.json", "w") as f:
        f.write(data_drift_report.json())
    
    report_dict = json.loads(data_drift_report.json())

    dataset_drift = report_dict["metrics"][0]["result"]["dataset_drift"]
    number_of_drifted_columns = report_dict["metrics"][0]["result"]["number_of_drifted_columns"]
    drift_columns = report_dict["metrics"][1]["result"]["drift_by_columns"]

    # Filter only columns where drift was detected
    drifted_columns_info = {
        col: details for col, details in drift_columns.items() if details["drift_detected"]
    }

    drift_columns_name = list(drifted_columns_info.keys())
    
    return {"status": "success", "dataset_drift": dataset_drift, "number_of_drifted_columns": number_of_drifted_columns, "drift_columns_name": drift_columns_name}
