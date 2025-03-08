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
from utils.aws import create_presigned_url, create_presigned_post, get_training_script_url
from utils.ssh_utils import generate_ssh_key_pair, attach_ssh_key_to_instance, connect_with_retries
import os
from pathlib import Path
import requests
from settings.config import CLOUD_INSTANCE_SERVICE_URL
import paramiko
import json

class TrainingProcessConfig:
    def __init__(self, 
                 saved_model_url: str,
                 saved_model_fit_history_url: str,
                 dataset_url: str, 
                 dataset_label_url: str, 
                 train_script_url: str, 
                 training_time: int, 
                 presets: dict, 
                 task_id: str, 
                 instance_info: dict,
                 target_column: str, 
                 extra_args: str):
        self.saved_model_url = saved_model_url
        self.saved_model_fit_history_url = saved_model_fit_history_url
        self.dataset_url = dataset_url
        self.dataset_label_url = dataset_label_url
        self.train_script_url = train_script_url
        self.training_time = training_time
        self.presets = presets
        self.task_id = task_id
        self.instance_info = instance_info
        self.target_column = target_column
        self.extra_args = extra_args


def train(task_id: str, request: dict):
    print("task_id:", task_id)
    print("Cloud Training request received")
    start = perf_counter()
    # send the metadata including dataset_url, training_metadata: training_time and presets, train_script_url
    try:
        model_bucket_path = f"{request['username']}/{request['project_id']}/{task_id}/trained_model.zip"
        model_fit_history_path = f"{request['username']}/{request['project_id']}/{task_id}/model_fit_history.json"
        
        # create presigned urls for upload model and fit_history
        saved_model_url = create_presigned_post(model_bucket_path)
        saved_model_fit_history_url = create_presigned_post(model_fit_history_path)
        
        # print(type(json.dumps(saved_model_url)))
        
        # return {"status": "success", "saved_model_url": saved_model_url, "saved_model_fit_history_url": saved_model_fit_history_url}
        
        # defines necessary urls
        dataset_url = request["dataset_url"]
        dataset_label_url = request["dataset_label_url"]
        train_script_url = get_training_script_url(request['task'])
        
        if request['task'] == "MULTIMODAL_CLASSIFICATION":
            extra_args = f" '{request['image_column']}'"
        else:
            extra_args = None
        
        training_config = TrainingProcessConfig(json.dumps(saved_model_url), json.dumps(saved_model_fit_history_url), dataset_url, dataset_label_url, train_script_url, request["training_time"], request["presets"], task_id, request["instance_info"], request["target_column"], extra_args=extra_args)
        
        
        train_response = execute_training_process(training_config)
        
        print(train_response)
        
        
        
        end = perf_counter()
        
        return {
            "training_evaluation_time": end - start,
            "saved_model_path": saved_model_url,
            "data": train_response
        }

    except Exception as e:
        print(e)
        return {"error": str(e)}


def execute_training_process(config: TrainingProcessConfig):
    # Define your connection details (get from instance service)
    
    ip = config.instance_info["public_ip"]
    port = config.instance_info["ssh_port"]
    username = "root"

    # Initialize the SSH client
    ssh_client = paramiko.SSHClient()

    # Automatically add the server's host key (be cautious about this in production)
    ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    private_key_path = generate_ssh_key_pair(config.task_id)
    
    # Attach the public key to the instance
    attach_response = attach_ssh_key_to_instance(config.task_id, config.instance_info["id"])
    print(attach_response)
    # Connect to the remote server with custom port
    try:
        ssh_client = connect_with_retries(ip, port, username, private_key_path, max_retries=10, delay=5)
    except Exception as e:
        print(e)
        return {"status": "error", "error": str(e)}
    
    # screen, nohup
    
    # check if the setup is there
    check_setup(ssh_client, config.train_script_url)

    activate_env_command = "source /opt/conda/bin/activate base"
    
    command = f"{activate_env_command} && source train.sh '{config.task_id}' '{config.dataset_url}' '{config.dataset_label_url}' '{config.training_time}' '{config.presets}' 'trained_model.zip' '{config.saved_model_url}' '{config.saved_model_fit_history_url}' '{config.target_column}'"
    
    if config.extra_args:
        command += config.extra_args
    
    print(command) 
    
    print("Start training" + "\n")
    stdin, stdout, stderr = ssh_client.exec_command(command)
    print("Errors:", stderr.read().decode())
    
    print("Finished training" + "\n")


    # stdin, stdout, stderr = ssh_client.exec_command(f"source cleanup.sh '{config.task_id}'")
    # print("Output: \n", stdout.read().decode())
    # print("Errors:", stderr.read().decode())

    # Close the connection
    ssh_client.close()
    return {"status": "success", "model_url": config.saved_model_url, "model_fit_history_url": config.saved_model_fit_history_url}


def check_setup(ssh_client, train_script_url):
    # check if the setup is correct
    stdin, stdout, stderr = ssh_client.exec_command(f"test -f train_script.zip && echo 'exists' || echo 'missing'")
    # if "exists" in stdout.read().decode():
    #     print("Instance already setup")
    #     return
    
    print("Setting up instance")
    stdin, stdout, stderr = ssh_client.exec_command(f"sudo apt-get install screen unzip nano zsh htop default-jre zip -y")
    print("Errors:", stderr.read().decode())

    # pull dataset
    stdin, stdout, stderr = ssh_client.exec_command(f"wget -O train_script.zip '{train_script_url}'")
    print("Errors:", stderr.read().decode())

    stdin, stdout, stderr = ssh_client.exec_command(f"unzip -o train_script.zip")
    print("Errors:", stderr.read().decode())
    
    activate_env_command = "source /opt/conda/bin/activate base"

    stdin, stdout, stderr = ssh_client.exec_command(f"{activate_env_command} && source setup_dependencies.sh")
    print("Errors:", stderr.read().decode())
    
    print("Finished installing dependencies" + "\n")
