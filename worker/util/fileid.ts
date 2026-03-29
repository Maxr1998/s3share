import {encode} from "@urlpack/base62"
import {env} from "cloudflare:workers"
import {base64ToUint8Array} from "uint8array-extras"

const FILE_ID_LENGTH = 10

let fileIdKey: CryptoKey

/**
 * Generate a key used to derive the file id from an upload token.
 */
async function createFileIdKey(): Promise<CryptoKey> {
    if (!fileIdKey) {
        const rawKey = base64ToUint8Array(env.FILE_ID_KEY)
        fileIdKey = await crypto.subtle.importKey(
            "raw",
            rawKey,
            {name: "HMAC", hash: "SHA-256"},
            false,
            ["sign"],
        )
    }
    return fileIdKey
}

/**
 * Derive a file id from the given token.
 */
export async function generateFileId(token: string): Promise<string> {
    const key = await createFileIdKey()

    const encoder = new TextEncoder()
    const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(token))
    return encode(new Uint8Array(mac, 0, FILE_ID_LENGTH))
}