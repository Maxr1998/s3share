import {base64ToUint8Array, uint8ArrayToHex} from "uint8array-extras"
import type {EncryptedValue} from "../../worker/api/encryptedvalue"
import {FileDecryptor} from "./decryptor"
import {importIv} from "./key"

export async function decrypt(value: EncryptedValue, key: CryptoKey): Promise<Uint8Array> {
    const encrypted = base64ToUint8Array(value.value)
    const iv = importIv(value.iv)
    const decrypter = new FileDecryptor(key, iv)
    return await decrypter.decryptFinal(encrypted)
}

export async function decryptToString(value: EncryptedValue, key: CryptoKey): Promise<string> {
    const buf = await decrypt(value, key)
    return new TextDecoder().decode(buf)
}

export async function decryptToHex(value: EncryptedValue, key: CryptoKey): Promise<string> {
    const buf = await decrypt(value, key)
    return uint8ArrayToHex(buf)
}