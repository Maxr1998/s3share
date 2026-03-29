import {isUint8Array} from "uint8array-extras"
import {FETCH_FAILED} from "../constants"
import {AES_BLOCK_SIZE} from "../crypto/constants"
import {FileDecryptor} from "../crypto/decryptor"
import type {ProgressTracker} from "./progress"

interface BufferedTransformer<I = any, O = any> extends Transformer<I, O> {
    buffer?: Uint8Array | null
}

export async function streamDownloadDecryptToDisk(url: string,
                                                  fileDecrypter: FileDecryptor,
                                                  outputStream: WritableStream,
                                                  progressTracker: ProgressTracker) {
    const responseBodyStream = fetch(url).then(response => {
        if (!response.ok || response.body == null) {
            throw new Error(FETCH_FAILED)
        }
        return response.body
    })

    const transformer: BufferedTransformer<ArrayBufferView, ArrayBufferView> = {
        start() {
            this.buffer = null
        },
        async transform(chunk, controller) {
            if (isUint8Array(chunk)) {
                let offset = 0
                if (this.buffer) {
                    offset = AES_BLOCK_SIZE - this.buffer.length
                    const temp = new Uint8Array(AES_BLOCK_SIZE)
                    temp.set(this.buffer, 0)
                    temp.set(chunk.subarray(0, offset), this.buffer.length)
                    controller.enqueue(await fileDecrypter.decrypt(temp))
                    this.buffer = null
                }

                const chunkRemainder = chunk.length - offset
                const processableBytes = Math.floor(chunkRemainder / AES_BLOCK_SIZE) * AES_BLOCK_SIZE
                if (processableBytes > 0) {
                    const ciphertext = chunk.subarray(offset, offset + processableBytes)
                    const plaintext = await fileDecrypter.decrypt(ciphertext)
                    controller.enqueue(plaintext)
                }

                const processedBytes = offset + processableBytes
                if (processedBytes < chunk.length) {
                    this.buffer = chunk.slice(processedBytes)
                }
                progressTracker.update(processedBytes)
            }
        },
        async flush(controller) {
            const result = await fileDecrypter.decryptFinal(this.buffer ?? new Uint8Array(0))
            if (result.byteLength > 0) {
                controller.enqueue(result)
            }
        },
    }

    const transformStream = new TransformStream(
        transformer,
        new ByteLengthQueuingStrategy({
            highWaterMark: 1 << 20,
        }),
        new ByteLengthQueuingStrategy({
            highWaterMark: 1 << 20,
        }),
    )

    return responseBodyStream.then(s => s.pipeThrough(transformStream).pipeTo(outputStream))
}