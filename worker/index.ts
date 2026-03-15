import {UploadCompleteRequestSchema, UploadCreateRequestSchema, UploadPartsRequestSchema} from "./api/upload"
import {download} from "./download/handler"
import {completeUpload, createUpload, generateUploadParts} from "./upload/handler"
import {handlePostJson, hasMethod} from "./util/request"
import {methodNotAllowed} from "./util/response"

export default {
    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url)
        switch (url.pathname) {
            case '/download':
                if (!hasMethod(request, 'GET')) {
                    return methodNotAllowed('GET')
                }
                return await download(url.searchParams)
            case '/upload/create': {
                return await handlePostJson(request, UploadCreateRequestSchema, createUpload)
            }
            case '/upload/parts': {
                return await handlePostJson(request, UploadPartsRequestSchema, generateUploadParts)
            }
            case '/upload/complete': {
                return await handlePostJson(request, UploadCompleteRequestSchema, completeUpload)
            }
            default:
                return new Response('Not Found', {
                    status: 404,
                    statusText: 'Not Found',
                })
        }
    },
}