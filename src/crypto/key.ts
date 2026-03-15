import {base64ToUint8Array} from "uint8array-extras"
import {bufToBn} from "../utils/conversion"

const subtle = window.crypto.subtle

export function importKey(key: string): Promise<CryptoKey> {
    const rawKey = base64ToUint8Array(key)
    return subtle.importKey(
        "raw",
        rawKey,
        {name: "AES-CTR"},
        false,
        ["encrypt", "decrypt"],
    )
}

export function importIv(iv: string): bigint {
    const ivBuf = base64ToUint8Array(iv)
    return bufToBn(ivBuf.buffer)
}