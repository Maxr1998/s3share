import {AesCtrBase} from "./base";

const subtle = window.crypto.subtle

export class FileDecryptor extends AesCtrBase {
    async decrypt(ciphertext: Uint8Array<ArrayBufferLike>): Promise<Uint8Array<ArrayBuffer>> {
        const plaintext = subtle.decrypt(this.params, this.key, ciphertext as BufferSource)
        this.incrementCounter(ciphertext.byteLength)
        return new Uint8Array(await plaintext)
    }
}