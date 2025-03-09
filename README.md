
# Astral

Open-source Automated Machine Learning(AutoML) platform


## Demo

[Demo link](https://drive.google.com/file/d/1fnfsqEO_D0xodWgOfx1G_zWlF6_sVpeu/view?usp=sharing)


## Environment Variables

To run this project, you will need to add the following environment variables to your .env file. Change the ```PORT_``` variables to your choices.

```bash
# ENVS FOR FRONTEND
PORT=PORT_FE
REACT_APP_API_URL=http://backend:PORT_BE
REACT_APP_DOMAIN_NAME=
ESLINT_NO_DEV_ERRORS=true

# ENVS FOR BACKEND
PORT=PORT_BE
HOST_IP=localhost
PUBLIC_PORT=
DATABASE_URL=mongodb://mongodb:27017/automl
GCP_BUCKET_NAME=xbcxyz
GCP_SERVICE_ACCOUNT=abcxyz
GCP_PROJECT_ID=abcxyz
ACCESS_TOKEN_SECRET="required, please go to <https://www.grc.com/passwords.htm> and copy code from the box '63 random alpha-numeric characters (a-z, A-Z, 0-9)'"
REFRESH_TOKEN_SECRET="required, please go to <https://www.grc.com/passwords.htm> and copy code from the box '63 random alpha-numeric characters (a-z, A-Z, 0-9)'. This should be different from ACCESS_TOKEN_SECRET"
WEB_SERVICE_ADDR=http://frontend:PORT_FE
ML_SERVICE_ADDR=http://localhost:PORT_MLS
DATA_SERVICE_ADDR=http://localhost:PORT_DTS
DATA_SERVICE_PUBLIC_ADDR=http://localhost:PORT_DTS
INFERENCE_SERVICE_ADDR=http://localhost:PORT_INF
RESOURCE_SERVICE_ADDR=http://localhost:PORT_RES
MONITORING_SERVICE_ADDR=http://localhost:PORT_MON
MAX_IMPORT_SIZE=200
REDIS_HOST=be-redis
REDIS_PORT=6379

OPENAI_API_KEY=

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_BUCKET_NAME=
```

Also you need to add these environment to your environment.ini file for other services.
```bash
# GENERAL ENVS FOR ALL SERVICES
[backend]
host=http://localhost:PORT_BE
ACCESS_TOKEN_SECRET=copy_from_env_file
REFRESH_TOKEN_SECRET=copy_from_env_file

[vastai]
API_KEY=

[aws]
BUCKET_NAME=
BUCKET_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

[gcloud]
GCP_CREDENTIALS=./service-account.json

# ENVS FOR ML_SERVICE

[ml_service]
name = ML service
ml_api_port = PORT_MLS
ml_api_host = 0.0.0.0
url = http://localhost:PORT_MLS

# if run on docker, rename the host to the container name
[redis]
host = localhost
port = 10051
pass = password
db = 0


[rabbitmq]
host = localhost
post = 10052
user = guest
pass = guest
vhost = 


[celery]
query = ml_celery
queue = ml_celery


[tensorboard]
port=10056


# ENVS FOR DATA_SERVICE
[data_service]
name = data service
port = PORT_DTS
host = 0.0.0.0
url = http://localhost:PORT_DTS

[label_studio]
host=http://localhost:PORT_LBS
api_key=

# ENVS FOR RESOURCE_SERVICE
[resource_service]
name = resource service
port = PORT_RES
host = 0.0.0.0
url=http://localhost:PORT_RES
REALTIME_INFERENCE_PORT=8680


# ENVS FOR MONITORING_SERVICE
[monitoring_service]
name = monitoring service
port = PORT_MON
host = 0.0.0.0
url = http://localhost:PORT_MON

# ENVS FOR INFERENCE_SERVICE
[inference_service]
name = inference service
port = PORT_INF
host = 0.0.0.0
url = http://localhost:PORT_INF
```
    
## How to run
### Docker
```
docker compose build && docker compose up
```

### Other ways
You can run separate services by installing necessary packages, creating respective .env or environment.ini file and then follow the README.md at each folder.