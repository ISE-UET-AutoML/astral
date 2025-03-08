import dotenv from 'dotenv'
import path from 'path'
import { Storage } from '@google-cloud/storage'
import { BucketOptions, IdempotencyStrategy } from '@google-cloud/storage/build/src/storage.js'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const gcs = new Storage({
    keyFilename: path.join(__dirname, 'service-account.json')
})

const retryOptions: BucketOptions = {
    // autoRetry: true,
    // retryDelayMultiplier: 3,
    // totalTimeout: 500,
    // maxRetryDelay: 60,
    // maxRetries: 5,
    // idempotencyStrategy: IdempotencyStrategy.RetryAlways,
}

const storageBucket = gcs.bucket(process.env.GCP_BUCKET_NAME || '', retryOptions)
const storageBucketName = process.env.GCP_BUCKET_NAME
const storageBucketURL = `gs://${process.env.GCP_BUCKET_NAME}`
const port = process.env.PORT
const databaseURL = process.env.DATABASE_URL
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || ''
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || ''
const webServiceAddr = process.env.WEB_SERVICE_ADDR
const mlServiceAddr = process.env.ML_SERVICE_ADDR

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
}

export default config
