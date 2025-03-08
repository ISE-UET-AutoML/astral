from pydantic import BaseModel



class InstanceInfo(BaseModel):
    id: int
    ssh_port: str
    public_ip: str
    deploy_port: str
        
    

class CloudTrainRequest(BaseModel):
    username: str
    dataset_url: str
    dataset_label_url: str
    task: str
    project_id: str
    training_time: int = 60
    presets: str = "high_quality"
    instance_info: InstanceInfo
    

class CloudDeployRequest(BaseModel):
    dataset_url: str
    dataset_label_url: str
    training_time: int = 60
    presets: str = "high_quality"
    