import type {FileMetadata} from "../../worker/api/filemetadata"
import type {
    UploadCompleteRequest,
    UploadCompleteResponse,
    UploadCreateRequest,
    UploadCreateResponse,
    UploadPart,
    UploadPartsRequest,
} from "../../worker/api/upload"
import {post} from "../request"

export async function prepareUpload(uploadToken: string): Promise<string> {
    const request: UploadCreateRequest = {
        token: uploadToken,
    }
    const response = await post("/upload/create", request)

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

    return await response.json()
}