import {INVALID_UPLOAD_URL} from "./constants";

export async function post(url: string, body: Record<string, unknown>): Promise<Response> {
    const response = await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
    })
    if (!response.ok) {
        return Promise.reject(INVALID_UPLOAD_URL)
    }
    return response
}