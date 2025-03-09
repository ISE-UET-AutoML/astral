from fastapi import FastAPI
from app.api.aws_api import router as aws_router
from app.api.gcp_api import router as gcp_router
from app.api.vastai_api import router as vastai_router


# from app.api.gcp_api import router as gcp_router

app = FastAPI()

# Include API routers for AWS and GCP
app.include_router(aws_router, prefix="/aws", tags=["AWS"])
app.include_router(gcp_router, prefix="/gcp", tags=["GCP"])
app.include_router(vastai_router, prefix="", tags=["VASTAI"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=config.HOST, port=config.PORT, reload=True)