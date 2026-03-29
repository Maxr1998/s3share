import {bnToUint8Array} from "../utils/conversion"
import {AES_BLOCK_SIZE, COUNTER_BITS} from "./constants"

export abstract class AesCtrBase {
    readonly key: CryptoKey
    readonly iv: bigint
    private counter: bigint
    private readonly counterArray: Uint8Array<ArrayBuffer>
    protected readonly params: AesCtrParams
    private isFinalized = false

    constructor(key: CryptoKey, iv: bigint) {
        this.key = key
        this.iv = iv
        this.counter = iv
        this.counterArray = new Uint8Array(AES_BLOCK_SIZE)

        this.params = {
            name: "AES-CTR",
            counter: this.counterArray,
            length: COUNTER_BITS,
        }

        bnToUint8Array(this.counter, this.counterArray)
    }

    protected incrementCounter(bytes: number) {
        if (this.isFinalized) {
            throw new Error("Instance has already been finalized")
        }
        if (bytes % AES_BLOCK_SIZE !== 0) {
            throw new Error("Data must be AES block-aligned for non-final operations")
        }
        this.counter += BigInt(bytes / AES_BLOCK_SIZE)
        bnToUint8Array(this.counter, this.counterArray)
    }

    protected finalize() {
        if (this.isFinalized) {
            throw new Error("Instance has already been finalized")
        }
        this.isFinalized = true
    }
}