import {AesCtrBase} from "./base"

const subtle = window.crypto.subtle

export class FileEncryptor extends AesCtrBase {
    async encrypt(plaintext: Uint8Array<ArrayBufferLike>): Promise<Uint8Array<ArrayBuffer>> {
        const ciphertextPromise = subtle.encrypt(this.params, this.key, plaintext as BufferSource)
        this.incrementCounter(plaintext.byteLength)
        return new Uint8Array(await ciphertextPromise)
    }

    async encryptFinal(plaintext: Uint8Array<ArrayBufferLike>): Promise<Uint8Array<ArrayBuffer>> {
        this.finalize()
        return new Uint8Array(await subtle.encrypt(this.params, this.key, plaintext as BufferSource))
    }
}