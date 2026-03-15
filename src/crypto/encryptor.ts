import {AesCtrBase} from "./base"

const subtle = window.crypto.subtle

export class FileEncryptor extends AesCtrBase {
    async encrypt(plaintext: Uint8Array<ArrayBufferLike>): Promise<Uint8Array<ArrayBuffer>> {
        const ciphertext = subtle.encrypt(this.params, this.key, plaintext as BufferSource)
        this.incrementCounter(plaintext.byteLength)
        return new Uint8Array(await ciphertext)
    }
}