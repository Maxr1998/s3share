import {env} from "cloudflare:workers";
import {GetObjectCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {getS3Client} from "./s3client.js";

async function generateDownloadUrl(key) {
    const s3client = await getS3Client();
    const command = new GetObjectCommand({Bucket: env.S3_BUCKET, Key: key});
    return await getSignedUrl(s3client, command, {expiresIn: 600});
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        if (url.pathname !== '/download') {
            return new Response(null, {
                status: 404,
                statusText: 'Not Found',
            });
        }
        const params = new URLSearchParams(url.search);

        const fileId = params.get('file');
        if (fileId === null) {
            return new Response(null, {
                status: 400,
                statusText: 'Bad Request',
            });
        }

        const metadataJson = await env.METADATA.get(fileId);
        if (metadataJson === null) {
            return new Response(null, {
                status: 404,
                statusText: 'File not found',
            });
        }

        const metadata = JSON.parse(metadataJson);
        const downloadUrl = await generateDownloadUrl(fileId);

        return Response.json({
            file_id: fileId,
            metadata: metadata,
            url: downloadUrl,
        });
    }
}