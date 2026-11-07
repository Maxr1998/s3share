import {encode} from "@urlpack/base62"

const UPLOAD_TOKEN_BYTES = 16

/**
 * Create a new, random upload token.
 */
export function generateUploadToken(): string {
    return encode(crypto.getRandomValues(new Uint8Array(UPLOAD_TOKEN_BYTES)))
}