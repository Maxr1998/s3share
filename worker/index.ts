import {
    CheckUploadTokenRequestSchema,
    UploadCompleteRequestSchema,
    UploadCreateRequestSchema,
    UploadPartsRequestSchema,
} from "./api/upload"
import {download} from "./download/handler"
import {checkUploadSession, completeUpload, createUpload, generateUploadParts} from "./upload/handler"
import {handlePostJson, hasMethod} from "./util/request"
import {methodNotAllowed} from "./util/response"

export default {
    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url)
        switch (url.pathname) {
            case '/api/download':
                if (!hasMethod(request, 'GET')) {
                    return methodNotAllowed('GET')
                }
                return await download(url.searchParams)
            case '/api/upload/check':
                return await handlePostJson(request, CheckUploadTokenRequestSchema, checkUploadSession)
            case '/api/upload/create':
                return await handlePostJson(request, UploadCreateRequestSchema, createUpload)
            case '/api/upload/parts':
                return await handlePostJson(request, UploadPartsRequestSchema, generateUploadParts)
            case '/api/upload/complete':
                return await handlePostJson(request, UploadCompleteRequestSchema, completeUpload)
            default:
                return new Response('Not Found', {
                    status: 404,
                    statusText: 'Not Found',
                })
        }
    },
}