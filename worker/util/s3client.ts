import {env} from "cloudflare:workers"
import {S3Client} from "@aws-sdk/client-s3"

let s3client: S3Client

export function getS3Client(): S3Client {
    if (!s3client) {
        s3client = new S3Client({
            region: 'auto', // not applicable but required by SDK
            endpoint: env.S3_ENDPOINT,
            credentials: {
                accessKeyId: env.S3_ACCESS_KEY,
                secretAccessKey: env.S3_SECRET_KEY,
            },
        })
    }
    return s3client
}