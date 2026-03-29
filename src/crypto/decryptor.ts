import {AesCtrBase} from "./base"

const subtle = window.crypto.subtle

export class FileDecryptor extends AesCtrBase {
    async decrypt(ciphertext: Uint8Array<ArrayBufferLike>): Promise<Uint8Array<ArrayBuffer>> {
        const plaintextPromise = subtle.decrypt(this.params, this.key, ciphertext as BufferSource)
        this.incrementCounter(ciphertext.byteLength)
        return new Uint8Array(await plaintextPromise)
    }

    async decryptFinal(ciphertext: Uint8Array<ArrayBufferLike>): Promise<Uint8Array<ArrayBuffer>> {
        this.finalize()
        if (ciphertext.byteLength === 0) return new Uint8Array(0)
        return new Uint8Array(await subtle.decrypt(this.params, this.key, ciphertext as BufferSource))
    }
}