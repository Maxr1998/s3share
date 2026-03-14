// @ts-ignore
import {env} from "cloudflare:workers"
import {getS3Client} from "../util/s3client"
import {GetObjectCommand} from "@aws-sdk/client-s3"
import {getSignedUrl} from "@aws-sdk/s3-request-presigner"

export async function download(url: URL) {
    const params = new URLSearchParams(url.search)

    const fileId = params.get('file')
    if (fileId === null) {
        return new Response(null, {
            status: 400,
            statusText: 'Bad Request',
        })
    }
    const metadataJson = await env.METADATA.get(fileId)
    if (metadataJson === null) {
        return new Response(null, {
            status: 404,
            statusText: 'File not found',
        })
    }
    const metadata = JSON.parse(metadataJson)
    const downloadUrl = await generateDownloadUrl(fileId)
    return Response.json({
        file_id: fileId,
        metadata: metadata,
        url: downloadUrl,
    })

}

async function generateDownloadUrl(key: string): Promise<string> {
    const s3client = getS3Client()
    const command = new GetObjectCommand({Bucket: env.S3_BUCKET, Key: key})
    return await getSignedUrl(s3client, command, {expiresIn: 600})
}