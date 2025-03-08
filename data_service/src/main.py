from typing import Union
from fastapi import Request, FastAPI
from controller.autolabeling import label_project_data
from settings import config

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(debug=True)

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


from routes import router as api_router

app.include_router(api_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=config.HOST,
        port=int(config.PORT),
        reload=True,
    )
