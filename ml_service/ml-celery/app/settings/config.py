import configparser
import datetime
import pytz
import sys

# settings.py
import os




cfg = configparser.ConfigParser()
cfg.read("./environment.ini")
print(cfg)

if sys.platform.startswith("win32"):
    TEMP_DIR = "D:/tmp"
elif sys.platform.startswith("linux"):
    TEMP_DIR = "./tmp"
# =========================================================================
#                           TIMING CONFIG
# =========================================================================
u = datetime.datetime.utcnow()
u = u.replace(tzinfo=pytz.timezone("Asia/Ho_Chi_Minh"))

# =========================================================================
#                          PROJECT INFORMATION
# =========================================================================
PROJECT = cfg["project"]

# =========================================================================
#                          REDIS INFORMATION
# =========================================================================
REDIS = cfg["redis"]
REDIS_BACKEND = "redis://:{password}@{hostname}:{port}/{db}".format(
    hostname=REDIS["host"], password=REDIS["pass"], port=REDIS["port"], db=REDIS["db"]
)

# =========================================================================
#                          BROKER INFORMATION
# =========================================================================
RABBITMQ = cfg["rabbitmq"]
BROKER = "amqp://{user}:{pw}@{hostname}:{port}/{vhost}".format(
    user=RABBITMQ["user"],
    pw=RABBITMQ["pass"],
    hostname=RABBITMQ["host"],
    port=RABBITMQ["post"],
    vhost=RABBITMQ["vhost"],
)

# =========================================================================
#                          GOOGLE CLOUD INFORMATION
# =========================================================================

GCLOUD = cfg["gcloud"]
GCP_CREDENTIALS = GCLOUD["GCP_CREDENTIALS"]

# =========================================================================
#                           BACKEND INFORMATION
# =========================================================================
BACKEND = cfg["backend"]
BACKEND_HOST = BACKEND["host"]
ACCESS_TOKEN = BACKEND["ACCESS_TOKEN_SECRET"]
REFRESH_TOKEN = BACKEND["REFRESH_TOKEN_SECRET"]

# =========================================================================
#                           DATASERVICE INFORMATION
# =========================================================================
DATASERVICE = cfg["data_service"]
DATASERVICE_HOST = DATASERVICE["host"]

# =========================================================================
#                          VASTAI INFORMATION
# =========================================================================
VAST_AI_API_KEY = cfg["vastai"]["API_KEY"]

# =========================================================================
#                          AWS INFORMATION
# =========================================================================

BUCKET_NAME = cfg["aws"]["BUCKET_NAME"]
AWS_ACCESS_KEY_ID = cfg["aws"]["AWS_ACCESS_KEY_ID"]
AWS_SECRET_ACCESS_KEY = cfg["aws"]["AWS_SECRET_ACCESS_KEY"]
BUCKET_REGION = cfg["aws"]["BUCKET_REGION"]


# =========================================================================
#                          RESOURCE_SERVICE INFORMATION
# =========================================================================

CLOUD_INSTANCE_SERVICE_URL = cfg["resource_service"]["HOST"]
REALTIME_INFERENCE_PORT = cfg["resource_service"]["REALTIME_INFERENCE_PORT"]