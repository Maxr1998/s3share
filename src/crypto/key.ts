import {base64ToUint8Array, toUint8Array, uint8ArrayToBase64} from "uint8array-extras"
import {bnToUint8Array, bufToBn} from "../utils/conversion"
import {IV_LENGTH, IV_SIZE} from "./constants"

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

export async function generateKey(): Promise<CryptoKey> {
    return subtle.generateKey(
        {name: "AES-CTR", length: 256},
        true,
        ["encrypt", "decrypt"]
    )
}

export async function exportKey(key: CryptoKey): Promise<string> {
    const exported = await subtle.exportKey("raw", key)
    return uint8ArrayToBase64(toUint8Array(exported), {urlSafe: true})
}

export function importIv(iv: string): bigint {
    const ivBuf = base64ToUint8Array(iv)
    return bufToBn(ivBuf.buffer)
}

export function generateIv(): bigint {
    const ivBuf = new Uint8Array(IV_LENGTH)
    const view = new Uint8Array(ivBuf.buffer, 0, IV_SIZE)
    crypto.getRandomValues(view)
    return bufToBn(ivBuf.buffer)
}

export function exportIv(iv: bigint): string {
    const ivBuf = new Uint8Array(IV_LENGTH)
    bnToUint8Array(iv, ivBuf)
    return uint8ArrayToBase64(ivBuf)
}