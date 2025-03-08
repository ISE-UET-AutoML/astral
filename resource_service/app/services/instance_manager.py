import json

from app.models.aws_instance import AwsInstance
from app.models.gcp_instance import GcpInstance


# Đọc và parse dữ liệu từ terraform.tfstate thành dictionary
def read_terraform_state(file_path):
    with open(file_path, "r") as file:
        terraform_state = json.load(file)  # Parse JSON vào dictionary
    return terraform_state


def get_resources(platform: str):
    file_path = f"app/terraforms/{platform}/terraform.tfstate"  # Đảm bảo đường dẫn chính xác đến file của bạn
    terraform_state = read_terraform_state(file_path)
    return terraform_state["resources"]


def get_resource_by_resouce_name(resouce_name: str, platform: str) -> dict:
    resources = get_resources(platform)
    found_resource = None
    for resource in resources:
        if resource["name"] == resouce_name:
            found_resource = resource
            break

    return found_resource


def get_resource_by_id(id: str, platform: str) -> dict:
    resources = get_resources(platform)
    found_resource = None
    id_attr = "id"
    if platform == "gcp":
        id_attr = "instance_id"
    platform_attr = "aws"
    if platform == "gcp":
        platform_attr = "google_compute"

    for resource in resources:
        if (
            resource["type"] == f"{platform_attr}_instance"
            and resource["instances"]
            and resource["instances"][0]["attributes"][id_attr] == id
        ):
            found_resource = resource
            break

    return found_resource


def get_instance_info_by_resouce_name(resouce_name: str, platform: str) -> dict:
    resource = get_resource_by_resouce_name(resouce_name, platform)
    if platform == "aws":
        return AwsInstance.get_instance_info(resource)
    elif platform == "gcp":
        return GcpInstance.get_instance_info(resource)


def get_instance_info_by_id(id: str, platform: str) -> dict:
    resource = get_resource_by_id(id, platform)
    if platform == "aws":
        return AwsInstance.get_instance_info(resource)
    elif platform == "gcp":
        return GcpInstance.get_instance_info(resource)
