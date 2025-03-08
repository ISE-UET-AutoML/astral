import subprocess
import os

from app.models.instance import Instance


terraform_directory = "app/terraforms/"


def run_terraform_command(command: str, platform: str):
    """Chạy lệnh Terraform và trả về kết quả"""
    os.chdir(terraform_directory + platform)
    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        print(result.stdout)
    except subprocess.CalledProcessError as e:
        print("Lệnh thất bại!")
        print(e.stderr)  # In ra thông báo lỗi
    os.chdir("../../..")

    return result


def terraform_init(platform: str):
    command = ["terraform", "init"]
    run_terraform_command(command, platform)


# Lệnh terraform apply để áp dụng kế hoạch
def terraform_apply(target: str, platform: str):
    command = ["terraform", "apply", "-auto-approve", "-target", target]
    run_terraform_command(command, platform)


def terraform_destroy(target: str, platform: str):
    command = ["terraform", "destroy", "-auto-approve", "-target", target]
    run_terraform_command(command, platform)
    target = target.replace(".", "_")
    if target:
        file_name = f"{target}.tf"
        delete_file(file_name, platform)


def create_terraform_file(instance: Instance, platform: str):
    os.chdir(terraform_directory + platform)
    content = instance.get_terraform_config()
    file_name = f"{instance.type}_{instance.resource_name}.tf"
    with open(file_name, "w") as f:
        f.write(content)

    print(f"File '{file_name}' has been created successfully.")
    os.chdir("../../..")

    return file_name


def delete_file(file_name: str, platform: str):
    os.chdir(terraform_directory + platform)
    try:
        os.remove(file_name)
        print(f"File {file_name} đã được xóa thành công.")
    except FileNotFoundError:
        print(f"File {file_name} không tồn tại.")
    except PermissionError:
        print(f"Không có quyền xóa file {file_name}.")
    except Exception as e:
        print(f"Đã xảy ra lỗi khi xóa file: {e}")

    os.chdir("../../..")
