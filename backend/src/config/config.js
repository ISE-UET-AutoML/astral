import dotenv from "dotenv";
import path from "path";
import { Storage } from "@google-cloud/storage";
import { S3Client } from "@aws-sdk/client-s3";
import { IdempotencyStrategy } from "@google-cloud/storage/build/src/storage.js";
import { fileURLToPath } from "url";
import { max } from "d3";
import redis from "redis";

dotenv.config({ override: true, debug: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gcs = new Storage({
  keyFilename: path.join(__dirname, "service-account.json"),
});

const retryOptions = {
  autoRetry: true,
  retryDelayMultiplier: 3,
  totalTimeout: 500,
  maxRetryDelay: 60,
  maxRetries: 5,
  idempotencyStrategy: IdempotencyStrategy.RetryAlways,
};

/*-------------------------------------AWS S3------------------------------------------------------*/
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const s3BucketName = process.env.AWS_BUCKET_NAME;

/*------------------------------GOOGLE CLOUD STORAGE OLD--------------------------------------------*/

const storageBucket = gcs.bucket(process.env.GCP_BUCKET_NAME, retryOptions);
const storageBucketName = process.env.GCP_BUCKET_NAME;
const storageBucketURL = `gs://${process.env.GCP_BUCKET_NAME}`;

/*-------------------------------------PORT---------------------------------------------------------*/
const port = process.env.PORT;
const databaseURL = process.env.DATABASE_URL;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const webServiceAddr = process.env.WEB_SERVICE_ADDR;
const mlServiceAddr = process.env.ML_SERVICE_ADDR;
const dataServiceAddr =
  process.env.DATA_SERVICE_ADDR || "http://localhost:8676";
const dataServicePublicAddr = process.env.DATA_SERVICE_PUBLIC_ADDR;
const inferenceServiceAddr = process.env.INFERENCE_SERVICE_ADDR;
const hostIP = process.env.HOST_IP;
const publicPort = process.env.PUBLIC_PORT;

// const maxImportSize = process.env.MAX_IMPORT_SIZE || 1000;
const resourceServiceAddr = process.env.RESOURCE_SERVICE_ADDR;
const monitoringServiceAddr = process.env.MONITORING_SERVICE_ADDR;

/*-------------------------------------Redis------------------------------------------------------*/

const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

redisClient.on("error", (err) => {
  console.error("Error connecting to Redis:", err);
});

redisClient
  .connect()
  .then(() => console.log("Connected to Redis"))
  .catch(console.error);

/*-------------------------------------Chatbot------------------------------------------------------*/
const openai_api_key = process.env.OPENAI_API_KEY;


const config = {
  port,
  databaseURL,
  storageBucket,
  storageBucketName,
  storageBucketURL,
  accessTokenSecret,
  refreshTokenSecret,
  webServiceAddr,
  mlServiceAddr,
  hostIP,
  dataServiceAddr,
  dataServicePublicAddr,
  inferenceServiceAddr,
  // maxImportSize,
  s3Client,
  s3BucketName,
  resourceServiceAddr,
  redisClient,
  openai_api_key,
  publicPort,
  monitoringServiceAddr,
};

export default config;
