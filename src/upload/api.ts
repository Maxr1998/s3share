import type {FileMetadata} from "../../worker/api/filemetadata"
import type {
    CheckUploadTokenRequest,
    CheckUploadTokenResponse,
    UploadCompleteRequest,
    UploadCompleteResponse,
    UploadCreateRequest,
    UploadCreateResponse,
    UploadPart,
    UploadPartsRequest,
} from "../../worker/api/upload"
import {INVALID_UPLOAD_URL} from "../constants"
import {post} from "../request"

type UploadTokenValidationResult =
    | { valid: true, inProgress: boolean }
    | { valid: false }

export async function checkUploadToken(uploadToken: string): Promise<UploadTokenValidationResult> {
    const request: CheckUploadTokenRequest = {
        token: uploadToken,
    }
    const response = await post("/upload/check", request)
    if (!response.ok) return {valid: false}

    const checkUploadTokenResponse: CheckUploadTokenResponse = await response.json()
    return {valid: true, inProgress: checkUploadTokenResponse.in_progress}
}

export async function prepareUpload(uploadToken: string): Promise<string> {
    const request: UploadCreateRequest = {
        token: uploadToken,
    }
    const response = await post("/upload/create", request)
    if (!response.ok) return Promise.reject(INVALID_UPLOAD_URL)

    const uploadCreateResponse: UploadCreateResponse = await response.json()
    return uploadCreateResponse.session_key
}

export async function requestParts(
    uploadToken: string,
    sessionKey: string,
    partIndex: number,
    partCount: number,
): Promise<UploadPart[]> {
    const request: UploadPartsRequest = {
        token: uploadToken,
        session_key: sessionKey,
        part: partIndex,
        count: partCount,
    }
    const response = await post("/upload/parts", request)
    if (!response.ok) return Promise.reject(INVALID_UPLOAD_URL)

    return await response.json()
}

export async function completeUpload(
    uploadToken: string,
    sessionKey: string,
    fileMetadata: FileMetadata,
    etags: string[],
): Promise<UploadCompleteResponse> {
    const request: UploadCompleteRequest = {
        token: uploadToken,
        session_key: sessionKey,
        metadata: fileMetadata,
        etags: etags,
    }
    const response = await post("/upload/complete", request)
    if (!response.ok) return Promise.reject(INVALID_UPLOAD_URL)

    return await response.json()
}