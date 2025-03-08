import requests
import json
from app.config import API_KEY
from vastai import VastAI
import asyncio

vast_sdk = VastAI(api_key=API_KEY)
url = f"https://console.vast.ai/api/v0/instances?api_key={API_KEY}"

payload = {}
headers = {"Accept": "application/json", "Content-Type": "application/json"}
response = requests.request("GET", url, headers=headers, data=payload)

# gpu_util
# cpu_util
# disk_usage
# disk_space
# mem_limit
# mem_usage
# vmem_usage # bộ nhớ ảo sử dụng
# gpu_ram

general_thresold_when_running = 0.7
general_thresold_when_stopped = 0.8

thresolds_when_running = {
    "gpu_util": general_thresold_when_running,
    "cpu_util": general_thresold_when_running,
    "disk_util": general_thresold_when_running,
    "mem_util": general_thresold_when_running,
    "vmem_util": general_thresold_when_running,
}

thresolds_when_stopped = {
    "gpu_util": general_thresold_when_stopped,
    "cpu_util": general_thresold_when_stopped,
    "disk_util": general_thresold_when_stopped,
    "mem_util": general_thresold_when_stopped,
    "vmem_util": general_thresold_when_stopped,
}

appropriate_attr = {
    "image_uuid": ["pytorch/pytorch:2.1.2-cuda12.1-cudnn8-runtime"],
    "gpu_name": ["RTX 3060", "RTX 3070", "RTX 3080"],
}


def get_instances():
    response = requests.request("GET", url, headers=headers, data=payload)
    return response.json()["instances"]


def get_instance(id):
    instances = get_instances()
    found_instance = None
    for obj in instances:
        if obj["id"] == int(id):
            found_instance = obj
            break
    return found_instance


# main func
def get_instance_info(id):
    instance = get_instance(id)
    if instance:
        ssh_addr = instance["ssh_host"]
        ssh_port = instance["ssh_port"]
        public_ip = instance["public_ipaddr"]
        host_ports_22_tcp = instance["ports"]["22/tcp"][0]["HostPort"]
        host_ports_8680_tcp = None
        if "8680/tcp" in instance["ports"]:
            host_ports_8680_tcp = instance["ports"]["8680/tcp"][0]["HostPort"]
        return {
            "id": id,
            "ssh_port": host_ports_22_tcp,
            "public_ip": public_ip,
            "deploy_port": host_ports_8680_tcp,
        }
    return None


def get_ssh_info(id):
    instance = get_instance(id)
    if instance:
        ssh_addr = instance["ssh_host"]
        ssh_port = instance["ssh_port"]
        return {"ssh_addr": ssh_addr, "ssh_port": ssh_port}


def get_ip_and_hostport(id):
    instance = get_instance(id)
    if instance:
        public_ip = instance["public_ipaddr"]
        host_ports_8680_tcp = instance["ports"]["8680/tcp"][0]["HostPort"]
        return {"public_ip": public_ip, "hostports": host_ports_8680_tcp}


def is_enough_resources_for_training(
    instance: dict, task: str, training_time: int, presets: str
):
    actual_gpu_util = instance["gpu_util"]
    actual_cpu_util = instance["cpu_util"]
    actual_disk_util = instance["disk_usage"] / instance["disk_space"]
    actual_mem_util = instance["mem_usage"] / instance["mem_limit"]
    actual_vmem_util = instance["vmem_usage"] / instance["gpu_ram"]

    if instance["cur_state"] == "running":
        if (
            actual_gpu_util < thresolds_when_running.get("gpu_util")
            and actual_cpu_util < thresolds_when_running.get("cpu_util")
            and actual_disk_util < thresolds_when_running.get("disk_util")
            and actual_mem_util < thresolds_when_running.get("mem_util")
            and actual_vmem_util < thresolds_when_running.get("vmem_util")
        ):
            return True
    elif instance["cur_state"] == "stopped":
        if (
            actual_gpu_util < thresolds_when_stopped.get("gpu_util")
            and actual_cpu_util < thresolds_when_stopped.get("cpu_util")
            and actual_disk_util < thresolds_when_stopped.get("disk_util")
            and actual_mem_util < thresolds_when_stopped.get("mem_util")
            and actual_vmem_util < thresolds_when_stopped.get("vmem_util")
        ):
            return True

    return False


def get_appropriate_instance(task: str, training_time: int, presets: str):
    instances = get_instances()
    # appropriate_instance = None
    appropriate_instances = []
    for instance in instances:
        match = True
        for key, value in appropriate_attr.items():
            print(key, ": ", instance[key])
            if instance[key] not in value:
                match = False
                break
        if match == True:
            appropriate_instances.append(instance)
    for instance in appropriate_instances:
        return instance
        if is_enough_resources_for_training(instance, task, training_time, presets):
            return instance

    return None


async def select_available_instance(task: str, training_time: int, presets: str):
    appropriate_instance = get_appropriate_instance(task, training_time, presets)

    if appropriate_instance:
        if appropriate_instance["cur_state"] == "running":
            instance_id = appropriate_instance["id"]
            instance_info = get_instance_info(instance_id)
            print(instance_info)
            return instance_info
        elif appropriate_instance["cur_state"] == "stopped":
            instance_id = appropriate_instance["id"]
            print(vast_sdk.start_instance(ID=instance_id))

            threshold = 20
            count = 0

            while count < threshold:
                try:
                    instance_info = get_instance_info(instance_id)
                    print(instance_info)
                    print(
                        "Successfully get instance info, iter:",
                        count,
                        ", time: ",
                        count * 5,
                        "s",
                    )
                    count = threshold
                    return instance_info
                except:
                    print("Waiting for starting instance, iteration:", count)
                    count = count + 1
                    await asyncio.sleep(5)

    return None
