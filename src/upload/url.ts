import {INVALID_KEY, INVALID_UPLOAD_URL} from "../constants"
import {exportKey, generateKey, importKey} from "../crypto/key"

export type EncryptionKey = {
    key: CryptoKey,
    keyString: string,
}

export async function getUploadToken(): Promise<string> {
    const path = window.location.pathname

    if (!path) {
        return Promise.reject(INVALID_UPLOAD_URL)
    }

    if (!path.startsWith("/upload/")) {
        return Promise.reject(INVALID_UPLOAD_URL)
    }

    return path.slice(8) // strip /upload/
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