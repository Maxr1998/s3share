import {env} from "cloudflare:workers"
import type {
    UploadCompleteRequest,
    UploadCompleteResponse,
    UploadCreateRequest,
    UploadCreateResponse,
    UploadPartsRequest,
} from "../api/upload"
import {generateFileId} from "../util/fileid"
import {textResponse} from "../util/response"
import {cancelMultipartUpload, completeMultipartUpload, generatePartUrls, initiateMultipartUpload} from "./multipart"
import {getUploadSession, State} from "./session"

export async function createUpload(request: UploadCreateRequest): Promise<Response> {
    const session = await getUploadSession(request.token)
    if (session === null) {
        return textResponse(404, 'Not Found', ERROR_INVALID_SESSION)
    }

    if (session.state !== State.Pending) {
        const oldFileId = session.file_id
        if (!oldFileId) {
            return textResponse(500, 'Internal Server Error', ERROR_UNEXPECTED_SESSION_STATE)
        }
        const oldUploadId = session.upload_id
        if (!oldUploadId) {
            return textResponse(500, 'Internal Server Error', ERROR_UNEXPECTED_SESSION_STATE)
        }

        // Cancel current upload session
        await cancelMultipartUpload(oldFileId, oldUploadId).catch((e) => {
            // Ignore and log errors, this is allowed to fail if the upload was already completed or cancelled
            console.error('Failed to cancel multipart upload', e)
        })
    }

    const sessionKey = crypto.randomUUID()
    const fileId = await generateFileId(request.token)
    const uploadId = await initiateMultipartUpload(fileId)
    if (!uploadId) {
        return textResponse(500, 'Internal Server Error', 'Failed to initiate multipart upload')
    }

    // Update session info
    session.state = State.InProgress
    session.session_key = sessionKey
    session.file_id = fileId
    session.upload_id = uploadId

    await env.UPLOAD_SESSIONS.put(request.token, JSON.stringify(session))

    const response: UploadCreateResponse = {
        session_key: sessionKey,
    }
    return Response.json(response)
}

export async function generateUploadParts(request: UploadPartsRequest): Promise<Response> {
    const session = await getUploadSession(request.token)
    if (session === null) {
        return textResponse(404, 'Not Found', ERROR_INVALID_SESSION)
    }

    if (session.session_key !== request.session_key) {
        return textResponse(400, 'Bad Request', ERROR_INVALID_SESSION_KEY)
    }

    if (session.state !== State.InProgress) {
        return textResponse(400, 'Bad Request', ERROR_UNEXPECTED_SESSION_STATE)
    }

    const fileId = session.file_id
    if (!fileId) {
        return textResponse(500, 'Internal Server Error', ERROR_UNEXPECTED_SESSION_STATE)
    }

    const uploadId = session.upload_id
    if (!uploadId) {
        return textResponse(500, 'Internal Server Error', ERROR_UNEXPECTED_SESSION_STATE)
    }

    const parts = await generatePartUrls(fileId, uploadId, request.part, request.count)

    return Response.json(parts)
}

export async function completeUpload(request: UploadCompleteRequest): Promise<Response> {
    const session = await getUploadSession(request.token)
    if (session === null) {
        return textResponse(404, 'Not Found', ERROR_INVALID_SESSION)
    }

    if (session.session_key !== request.session_key) {
        return textResponse(400, 'Bad Request', ERROR_INVALID_SESSION_KEY)
    }

    if (session.state !== State.InProgress) {
        return textResponse(400, 'Bad Request', ERROR_UNEXPECTED_SESSION_STATE)
    }

    const fileId = session.file_id
    if (!fileId) {
        return textResponse(500, 'Internal Server Error', ERROR_UNEXPECTED_SESSION_STATE)
    }

    const uploadId = session.upload_id
    if (!uploadId) {
        return textResponse(500, 'Internal Server Error', ERROR_UNEXPECTED_SESSION_STATE)
    }

    await completeMultipartUpload(fileId, uploadId, request.etags)

    // Store metadata for uploaded file
    await env.METADATA.put(fileId, JSON.stringify(request.metadata))

    // Invalidate upload session
    await env.UPLOAD_SESSIONS.delete(request.token)

    const response: UploadCompleteResponse = {
        file_id: fileId,
    }

    return Response.json(response)
}

// Error messages
const ERROR_INVALID_SESSION = 'Session invalid or expired'
const ERROR_INVALID_SESSION_KEY = 'Invalid session key'
const ERROR_UNEXPECTED_SESSION_STATE = 'Unexpected session state'