import {
    AdminCreateUploadRequestSchema,
    CheckUploadTokenRequestSchema,
    UploadCompleteRequestSchema,
    UploadCreateRequestSchema,
    UploadPartsRequestSchema,
} from "./api/upload"
import {download} from "./download/handler"
import {
    adminCreateUpload,
    checkUploadSession,
    completeUpload,
    createUpload,
    generateUploadParts,
} from "./upload/handler"
import {validateAccess} from "./util/access"
import {handlePostJson, hasMethod} from "./util/request"
import {methodNotAllowed, textResponse} from "./util/response"

export default {
    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url)
        if (url.pathname.startsWith('/api/admin/') && !await validateAccess(request)) {
            return textResponse(403, 'Forbidden', 'Access denied')
        }
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
            case '/api/admin/create-upload':
                return await handlePostJson(request, AdminCreateUploadRequestSchema, adminCreateUpload)
            default:
                return new Response('Not Found', {
                    status: 404,
                    statusText: 'Not Found',
                })
        }
    },
}