from typing import Union
from fastapi import Request, FastAPI
from src.controller.autolabeling import label_project_data

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/projects/{project_id}")
def label_project_dataset(project_id):
    return label_project_data(project_id)


@app.post("/datasets")
async def label_dataset(req: Request):
    body = await req.json()
    return label_project_data(body)
