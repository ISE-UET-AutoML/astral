from fastapi import HTTPException
from fastapi import APIRouter

from app.services import terraform_utils
from app.models.aws_instance import AwsInstance
from app.services import instance_manager

router = APIRouter()


@router.post("/create-instance/")
async def create_instance(instance: AwsInstance):
    # Lệnh Terraform để tạo các instance
    print(terraform_utils.create_terraform_file(instance, "aws"))
    target = f"{instance.type}.{instance.resource_name}"

    try:
        terraform_utils.terraform_apply(target, "aws")
        value = instance_manager.get_instance_info_by_resouce_name(
            instance.resource_name, "aws"
        )
        return {"message": "Create instance successfully", "value": value}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/instance-info/{instance_id}")
async def get_instance_info(instance_id: str):
    # Lấy thông tin về instance từ Terraform state
    info = instance_manager.get_instance_info_by_id(instance_id, "aws")
    return {
        "message": f"Get info of instance {instance_id} successfully ",
        "value": info,
    }


@router.delete("/delete-instance/{instance_id}")
async def delete_instance(instance_id: str):
    # Xóa instance
    info = instance_manager.get_instance_info_by_id(instance_id, "aws")
    target = f"aws_instance.{info["name"]}"
    try:
        terraform_utils.terraform_destroy(target, "aws")
        return {"message": f"Instance {instance_id} deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
