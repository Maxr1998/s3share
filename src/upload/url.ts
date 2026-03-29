import {INVALID_KEY, INVALID_UPLOAD_URL} from "../constants"
import {exportKey, generateKey, importKey} from "../crypto/key"

export type EncryptionKey = {
    key: CryptoKey,
    keyString: string,
}

export function getUploadToken(): string {
    const prefix = "/upload/"

    const path = window.location.pathname
    if (!path.startsWith(prefix)) {
        throw new Error(INVALID_UPLOAD_URL)
    }

    const token = path.slice(prefix.length) // strip /upload/
    if (token.length === 0) {
        throw new Error(INVALID_UPLOAD_URL)
    }

    return token
}

export async function getEncryptionKey(): Promise<EncryptionKey> {
    const hash = window.location.hash

    let key: CryptoKey
    let keyString: string
    if (hash) {
        keyString = hash.slice(1) // strip #
        key = await importKey(keyString).catch(() => Promise.reject(INVALID_KEY))
    } else {
        // No key provided, generate a new one and update URL
        key = await generateKey()
        keyString = await exportKey(key)
        window.location.hash = "#" + keyString
    }

    return {
        key,
        keyString,
    }
}