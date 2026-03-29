import {base64ToUint8Array, uint8ArrayToBase64, uint8ArrayToHex} from "uint8array-extras"
import type {EncryptedValue} from "../../worker/api/encryptedvalue"
import {FileDecryptor} from "./decryptor"
import {FileEncryptor} from "./encryptor"
import {exportIv, generateIv, importIv} from "./key"

export async function decrypt(value: EncryptedValue, key: CryptoKey): Promise<Uint8Array> {
    const encrypted = base64ToUint8Array(value.value)
    const iv = importIv(value.iv)
    const decrypter = new FileDecryptor(key, iv)
    return await decrypter.decryptFinal(encrypted)
}

export async function encrypt(value: Uint8Array<ArrayBufferLike>, key: CryptoKey): Promise<EncryptedValue> {
    const iv = generateIv()
    const encrypter = new FileEncryptor(key, iv)
    const encrypted = await encrypter.encryptFinal(value)
    return {
        value: uint8ArrayToBase64(encrypted),
        iv: exportIv(iv),
    }
}

export async function decryptToString(value: EncryptedValue, key: CryptoKey): Promise<string> {
    const buf = await decrypt(value, key)
    return new TextDecoder().decode(buf)
}

export async function encryptFromString(value: string, key: CryptoKey): Promise<EncryptedValue> {
    const buf = new TextEncoder().encode(value)
    return await encrypt(buf, key)
}

export async function decryptToHex(value: EncryptedValue, key: CryptoKey): Promise<string> {
    const buf = await decrypt(value, key)
    return uint8ArrayToHex(buf)
}