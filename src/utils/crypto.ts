import {bnToUint8Array, bufToBn} from "./conversion";
import {base64ToUint8Array} from "uint8array-extras";

const subtle = window.crypto.subtle;

export const AES_BLOCK_SIZE = 16 // AES default block size
export const COUNTER_BITS = 64 // half of the IV / AES block size

export function importKey(key: string): Promise<CryptoKey> {
    const rawKey = base64ToUint8Array(key)
    return subtle.importKey(
        "raw",
        rawKey,
        {name: "AES-CTR"},
        false,
        ["encrypt", "decrypt"]
    )
}

export function importIv(iv: string): bigint {
    const ivBuf = base64ToUint8Array(iv)
    return bufToBn(ivBuf.buffer)
}

export class FileDecrypter {
    readonly key: CryptoKey
    readonly iv: bigint
    counter: bigint
    private readonly counterArray: Uint8Array

    constructor(key: CryptoKey, iv: bigint) {
        this.key = key
        this.iv = iv
        this.counter = iv
        this.counterArray = new Uint8Array(AES_BLOCK_SIZE)
        bnToUint8Array(this.counter, this.counterArray)
    }

    incrementCounter(bytes: number) {
        this.counter = this.counter + BigInt(Math.floor(bytes / AES_BLOCK_SIZE))
        bnToUint8Array(this.counter, this.counterArray)
    }

    async decrypt(ciphertext: Uint8Array): Promise<Uint8Array> {
        const params: AesCtrParams = {
            name: "AES-CTR",
            counter: this.counterArray,
            length: COUNTER_BITS,
        }
        const plaintext = subtle.decrypt(params, this.key, ciphertext)
        this.incrementCounter(ciphertext.byteLength)

        return new Uint8Array(await plaintext)
    }
}

export interface EncryptedValue {
    value: string;
    iv: string;
}

export async function decrypt(value: EncryptedValue, key: CryptoKey): Promise<Uint8Array> {
    const encrypted = base64ToUint8Array(value.value)
    const iv = importIv(value.iv)
    const decrypter = new FileDecrypter(key, iv)
    return await decrypter.decrypt(encrypted)
}

export async function decryptToString(value: EncryptedValue, key: CryptoKey): Promise<string> {
    const buf = await decrypt(value, key)
    return new TextDecoder().decode(buf)
}