from fastapi import APIRouter

from settings import config
from .label_studio import router as label_studio_router

router = APIRouter()

router.include_router(label_studio_router, prefix="/ls", tags=["label-studio"])
