from cgi import test
from email.mime import image
import re
from zipfile import ZipFile
from celery import shared_task
from sklearn.model_selection import train_test_split
from sympy import false, use
from tqdm import tqdm
from mq_main import redis
from time import perf_counter
import gdown
from .image_classify.autogluon_trainer import AutogluonTrainer
import uuid
from autogluon.multimodal import MultiModalPredictor
import joblib
from settings.config import TEMP_DIR
from utils.aws import create_presigned_url, create_presigned_post, get_training_script_url, get_inference_script_url
from utils.ssh_utils import generate_ssh_key_pair, attach_ssh_key_to_instance, get_private_key_filename, connect_with_retries
import os
from pathlib import Path
import requests
from settings.config import CLOUD_INSTANCE_SERVICE_URL, REALTIME_INFERENCE_PORT
import paramiko
import json

class DeployProcessConfig:
    def __init__(self, 
                 saved_model_url: str,
                 inference_script_url: str,
                 task_id: str, 
                 instance_info: dict, task: str):
        self.saved_model_url = saved_model_url
        self.inference_script_url = inference_script_url
        self.task_id = task_id
        self.instance_info = instance_info
        self.task = task

def task_to_service(task: str):
    match(task):
        case "IMAGE_CLASSIFICATION":
            return "ImageClassify"
        case "TEXT_CLASSIFICATION":
            return "TextClassify"
        case "TABULAR_CLASSIFICATION":
            return "TabularClassify"
        case "MULTIMODAL_CLASSIFICATION":
            return "MultiModalClassify"

def deploy(task_id: str, request: dict):
    print("Cloud Deploy request received")
    start = perf_counter()
    try:
        model_bucket_path = f"{request['username']}/{request['project_id']}/{request['task_id']}/trained_model.zip"
        
        saved_model_url = create_presigned_url(model_bucket_path)
        inference_script_url = get_inference_script_url(request['task'], request['deploy_type'])
    
        
        deploy_config = DeployProcessConfig(
            saved_model_url=saved_model_url,
            inference_script_url=inference_script_url,
            task_id=request["task_id"],
            instance_info=request["instance_info"],
            task=request["task"]
        )
        
        deploy_response = execute_deploy_process(deploy_config)
        
        print(deploy_response)
        
        end = perf_counter()
        
        return {
            "deployed_model_url": deploy_response["deploy_url"],
            "deploy_time": end - start,
        }

    except Exception as e:
        print(e)
        return {"error": str(e)}


def execute_deploy_process(config: DeployProcessConfig):
    # Define your connection details (get from instance service)
    ip = config.instance_info["public_ip"]
    port = config.instance_info["ssh_port"]
    username = "root"
    
    
    
    private_key_path = get_private_key_filename(config.task_id)
    
    # Attach the public key to the instance
    attach_response = attach_ssh_key_to_instance(config.task_id, config.instance_info["id"])
    
    print(attach_response)

    try:
        ssh_client = connect_with_retries(ip, port, username, private_key_path, max_retries=10)
    except Exception as e:
        print(e)
        return {"error": str(e)}

    # screen, nohup
    # # set up libs
    check_setup(ssh_client, config.inference_script_url)

    activate_env_command = "source /opt/conda/bin/activate base"

    command = f"{activate_env_command} && source setup.sh '{config.task_id}' '{config.saved_model_url}' '{task_to_service(config.task)}' '{REALTIME_INFERENCE_PORT}'"
    
    # set up the environment
    stdin, stdout, stderr = ssh_client.exec_command(command)
    print("Output: \n", stdout.read().decode())
    print("Errors:", stderr.read().decode())
    
    print("Finished deployment" + "\n")

    
    # stdin, stdout, stderr = ssh_client.exec_command(f"source cleanup.sh '{config.task_id}'")
    # print("Errors:", stderr.read().decode())
    
    # Close the connection
    ssh_client.close()
    return {"status": "success", "deploy_url": f"http://{config.instance_info['public_ip']}:{REALTIME_INFERENCE_PORT}"}


def check_setup(ssh_client, infer_script_url):
    # check if the setup is correct
    stdin, stdout, stderr = ssh_client.exec_command(f"test -f infer_script.zip && echo 'exists' || echo 'missing'")
    # if "exists" in stdout.read().decode():
    #     print("Instance already setup")
    #     return
    
    stdin, stdout, stderr = ssh_client.exec_command(f"sudo apt-get install screen unzip nano zsh htop lsof default-jre zip -y")
    print("Errors:", stderr.read().decode())

    # pull dataset
    stdin, stdout, stderr = ssh_client.exec_command(f"wget -O infer_script.zip '{infer_script_url}'")
    print("Errors:", stderr.read().decode())

    stdin, stdout, stderr = ssh_client.exec_command(f"unzip -o infer_script.zip")
    print("Errors:", stderr.read().decode())