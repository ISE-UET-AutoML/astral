from vastai import VastAI
import sys
import os
from fastapi import APIRouter

import app.services.vastai.instance_creator as instance_creator
import app.services.vastai.instance_manager as instance_manager
from app.config import API_KEY
from pydantic import BaseModel


class SshAttach(BaseModel):
    instance_id: int | str
    ssh_public_key: str


class InstanceRequest(BaseModel):
    task: str
    training_time: int
    presets: str


vast_sdk = VastAI(api_key=API_KEY)
router = APIRouter()


@router.get("/")
async def root():
    return {"message": "Hello World"}


@router.get("/instances")
async def get_instances():
    return instance_manager.get_instances()


@router.get("/instances/{instance_id}")
async def get_instance_info(instance_id: int):
    info = instance_manager.get_instance_info(instance_id)
    if info:
        return info
    return {"status": "failed"}


# return {"ssh_addr": str, "ssh_port": int}
@router.get("/instances/ssh_info/{instance_id}")
async def get_ssh(instance_id):
    return instance_manager.get_ssh_info(instance_id)


# return {"public_ip": str, "hostport": str}
@router.get("/instances/ip_and_hostport/{instance_id}")
async def get_ip_and_hostport(instance_id):
    return instance_manager.get_ip_and_hostport(instance_id)


@router.post("/instances")
async def create_instance(req: InstanceRequest):
    # TODO: Implement the logic to create an instance based on 3 parameters
    new_instance = await instance_creator.launch_instance(
        req.task, req.training_time, req.presets
    )
    return new_instance


@router.post("/select_instance")
async def select_instance(req: InstanceRequest):
    # TODO: If some routerropriate instances already running, select it and return the instance_id
    # TODO: If no instances are running, create a new instance
    # instance = await instance_manager.select_available_instance(
    #     req.task, req.training_time, req.presets
    # )
    # if instance:
    #     return instance
    new_instance = await instance_creator.launch_instance(
        req.task, req.training_time, req.presets
    )
    return new_instance


@router.get("/instances/start/{instance_id}")
async def start_instance(instance_id: int):
    return vast_sdk.start_instance(ID=instance_id)


# TODO: add shutdown instance method
@router.get("/instances/stop/{instance_id}")
async def stop_instance(instance_id: int):
    return vast_sdk.stop_instance(ID=instance_id)


@router.post("/instances/attach_ssh_key")
async def attach_ssh_key(ssh_attach: SshAttach):
    return vast_sdk.attach_ssh(
        instance_id=ssh_attach.instance_id, ssh_key=ssh_attach.ssh_public_key
    )


@router.delete("/instances/{instance_id}")
async def delete_instance(instance_id):
    return vast_sdk.destroy_instance(id=instance_id)
