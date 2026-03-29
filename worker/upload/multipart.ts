import {
    AbortMultipartUploadCommand,
    CompleteMultipartUploadCommand,
    CreateMultipartUploadCommand,
    UploadPartCommand,
} from "@aws-sdk/client-s3"
import {getSignedUrl} from "@aws-sdk/s3-request-presigner"
import {env} from "cloudflare:workers"
import type {UploadPart} from "../api/upload"
import {getS3Client} from "../util/s3client.js"

export async function initiateMultipartUpload(fileId: string): Promise<string | undefined> {
    const s3client = getS3Client()

    const multipartCommand = new CreateMultipartUploadCommand({
        Bucket: env.S3_BUCKET,
        Key: fileId,
    })
    const multipartUpload = await s3client.send(multipartCommand)

    return multipartUpload.UploadId
}

export async function cancelMultipartUpload(fileId: string, uploadId: string): Promise<void> {
    const s3client = getS3Client()

    const cancelCommand = new AbortMultipartUploadCommand({
        Bucket: env.S3_BUCKET,
        Key: fileId,
        UploadId: uploadId,
    })
    await s3client.send(cancelCommand)
}

export async function generatePartUrls(
    fileId: string,
    uploadId: string,
    partIndex: number,
    partCount: number,
): Promise<UploadPart[]> {
    const s3client = getS3Client()

    let parts: UploadPart[] = []

    for (let partNumber = partIndex; partNumber < partIndex + partCount; partNumber++) {
        const partCommand = new UploadPartCommand({
            Bucket: env.S3_BUCKET,
            Key: fileId,
            UploadId: uploadId,
            PartNumber: partNumber,
        })
        const partUrl = await getSignedUrl(s3client, partCommand, {expiresIn: 3600})

        parts.push({
            part: partNumber,
            url: partUrl,
        })
    }

    return parts
}

export async function completeMultipartUpload(fileId: string, uploadId: string, etags: string[]): Promise<void> {
    const s3client = getS3Client()

    const completeCommand = new CompleteMultipartUploadCommand({
        Bucket: env.S3_BUCKET,
        Key: fileId,
        UploadId: uploadId,
        MultipartUpload: {
            Parts: etags.map((etag, index) => ({
                ETag: etag,
                PartNumber: index + 1,
            })),
        },
    })
    await s3client.send(completeCommand)
}
