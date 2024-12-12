import {GetObjectCommand, S3Client} from '@aws-sdk/client-s3';
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";

async function generateDownloadUrl(env, bucket, key) {
    const s3client = new S3Client({
        region: 'auto', // not applicable but required by SDK
        endpoint: env.S3_ENDPOINT,
        credentials: {
            accessKeyId: env.S3_ACCESS_KEY,
            secretAccessKey: env.S3_SECRET_KEY,
        },
    });
    const command = new GetObjectCommand({Bucket: bucket, Key: key});
    return await getSignedUrl(s3client, command, {expiresIn: 600});
}

export async function onRequest({request, env}) {
    const url = new URL(request.url);
    const params = new URLSearchParams(url.search);

    const fileId = params.get('file');
    if (fileId === null) {
        return new Response(null, {
            status: 401,
            statusText: 'Bad Request',
        });
    }

    const metadataJson = await env.KV.get(fileId);
    if (metadataJson === null) {
        return new Response(null, {
            status: 404,
            statusText: 'File not found',
        });
    }

    const metadata = JSON.parse(metadataJson);
    const downloadUrl = await generateDownloadUrl(env, env.S3_BUCKET,  fileId);

    return Response.json({
        file_id: fileId,
        metadata: metadata,
        url: downloadUrl,
    });
}