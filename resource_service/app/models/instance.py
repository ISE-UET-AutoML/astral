from abc import ABC, abstractmethod
from pydantic import BaseModel


class Instance(ABC, BaseModel):
    type: str
    resource_name: str
    tag_name: str

    @abstractmethod
    def get_terraform_config(self) -> str:
        pass

    @abstractmethod
    def get_instance_info(resource: dict) -> dict:
        pass
