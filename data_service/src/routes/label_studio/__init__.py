from fastapi import APIRouter

from .project import router as project_router
from .task import router as task_router
from settings import config

router = APIRouter()

router.include_router(project_router, prefix="/project")
router.include_router(task_router, prefix="/task")


@router.get(
    "/attribute_types",
    tags=["utils"],
    description=(
        "Returns all the attribute types available for data, k"
        "key is the attribute name and value is the description, "
        "used to specify the type of data when importing tasks and later exporting them for training."
    ),
)
def get_attribute_types():
    return config.constants.data_attributes


@router.get(
    "/data_prefix",
    tags=["utils"],
    description=(
        "Returns the data prefix used to remove label studio attributes when exporting."
    ),
)
def get_data_prefix():
    return config.constants.data_prefix
