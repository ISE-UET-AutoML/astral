from pydantic_settings import BaseSettings, SettingsConfigDict


class Configs(BaseSettings):
    BACKEND_IP: str = "localhost:8760/"
    IMAGE_CLASSIFICATION_TAG: str = "IMAGE_CLASSIFICATION"
    TEXT_CLASSIFICATION_TAG: str = "TEXT_CLASSIFICATION"
    model_config = SettingsConfigDict(env_file=".env")


def get_config():
    # print(Configs())
    return Configs()
