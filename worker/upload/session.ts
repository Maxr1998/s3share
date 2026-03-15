import {env} from "cloudflare:workers"

export enum State {
    Pending = "PENDING",
    InProgress = "IN_PROGRESS",
}

/**
 * Used for internal tracking of an upload session.
 */
export type UploadSessionInfo = {
    state: State
    session_key?: string
    file_id?: string
    upload_id?: string
    file_size?: number
}

export async function getUploadSession(token: string): Promise<UploadSessionInfo | null> {
    const sessionJson = await env.UPLOAD_SESSIONS.get(token)
    if (sessionJson === null) {
        return null
    }

    return JSON.parse(sessionJson)
}