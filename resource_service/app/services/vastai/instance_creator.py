import asyncio
from vastai import VastAI
import json
import re
from app.config import API_KEY


import app.services.vastai.instance_manager as instance_manager

vast_sdk = VastAI(api_key=API_KEY)

env_sample = "-p 8081:8081 -p 8680:8680 -p 8681:8681 -p 8682:8682 -p 8683:8683 -p 8684:8684 -p 8685:8685 -p 54321:54321"


def convert_str_to_dict(str):
    json_part = re.search(r"\{.*\}", str).group(0)
    json_part = (
        json_part.replace("'", '"').replace("True", "true").replace("False", "false")
    )

    data_object = json.loads(json_part)
    return data_object


def get_instance_id(str):
    obj = convert_str_to_dict(str)
    return obj["new_contract"]


def is_success(str):
    obj = convert_str_to_dict(str)
    return obj["success"]


def sdk_launch_instance(gpu_name: str = "RTX_3060", region: str = ""):
    instance = vast_sdk.launch_instance(
        num_gpus="1",
        gpu_name=gpu_name,
        region=region,
        disk=40,
        image="pytorch/pytorch:2.1.2-cuda12.1-cudnn8-runtime",
        env=env_sample,
        jupyter_dir="/",
        jupyter_lab=True,
        ssh=True,
        direct=True,
        label="Automl instance",
        onstart_cmd="sudo apt-get install screen unzip libjpeg-dev libpng-dev nano zsh htop lsof default-jre zip -yenv | grep _ >> /etc/environment; echo 'starting up'",
    )
    return instance


# Main function
# Create new instance and return (instance id, ssh_addr, ssh_port)
async def launch_instance(task: str, training_time: int, presets: str):
    instance = sdk_launch_instance()
    print(instance)
    print("----------")

    if not (instance and is_success(instance)):
        print("Failed to create instance! No offer found!")
        print("Recreating instance...")
        instance = sdk_launch_instance()
        print(instance)
        print("----------")

    if not (instance and is_success(instance)):
        print("Failed to create instance! No offer found!")
        print("Recreating instance...")
        instance = sdk_launch_instance(gpu_name="RTX_3070")
        print(instance)
        print("----------")

    if not (instance and is_success(instance)):
        print("Failed to create instance! No offer found!")
        print("Recreating instance...")
        instance = sdk_launch_instance(gpu_name="RTX_3080")
        print(instance)
        print("----------")

    if instance:
        instance_id = get_instance_id(instance)
        print(instance_id)

        threshold = 20  # 20*5 = 100s
        count = 0

        while count < threshold:
            try:
                instance_info = instance_manager.get_instance_info(instance_id)
                print(instance_info)
                print(
                    "Successfully get instance info, iter:",
                    count,
                    ", time: ",
                    count * 5,
                    "s",
                )
                count = threshold
                if instance_info:
                    await asyncio.sleep(1)
                return instance_info
            except:
                print("Waiting for launching instance, iteration:", count)
                count = count + 1
                await asyncio.sleep(5)

    print("Instance takes too long to launch successfully!")
    print("Recreating instance...")
    vast_sdk.destroy_instance(id=instance_id)
    return await launch_instance(task, training_time, presets)
