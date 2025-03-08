# How to run

## Setup .env

create .env:

```
PORT=8000
DATABASE_URL=mongodb://0.0.0.0:27017
GCP_BUCKET_NAME=<bucketname> # you can use fake value for this field
GCP_SERVICE_ACCOUNT=fake_string # you can use fake value for this field
GCP_PROJECT_ID=fake_string # you can use fake value for this field
ACCESS_TOKEN_SECRET=fake_string # you can use fake value for this field
REFRESH_TOKEN_SECRET=fake_string # you can use fake value for this field
WEB_SERVICE_ADDR=http://localhost:3000
ML_SERVICE_ADDR=http://0.0.0.0:8670
DATA_SERVICE_ADDR=http://localhost:8671
INFERENCE_SERVICE_ADDR=http://localhost:8672
RESOURCE_SERVICE_ADDR=http://localhost:8673
MAX_IMPORT_SIZE=200
REDIS_HOST=localhost
REDIS_PORT=6379 # default is 6379, modify to avoid conflicts
```

## Setup google-cloud

add config/service-account.json

## Start mongod

Ubuntu:

```
sudo systemctl start mongod
```

<!-- Change redis port to avoid conflict -->

## Start Redis & Mongodb

```
docker compose up -d redis mongodb
```

## Finally

```
yarn dev
```
