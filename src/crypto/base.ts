import {bnToUint8Array} from "../utils/conversion"
import {AES_BLOCK_SIZE, COUNTER_BITS} from "./constants"

export abstract class AesCtrBase {
    readonly key: CryptoKey
    readonly iv: bigint
    private counter: bigint
    private readonly counterArray: Uint8Array<ArrayBuffer>
    protected readonly params: AesCtrParams

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
        this.counter = this.counter + BigInt(Math.floor(bytes / AES_BLOCK_SIZE))
        bnToUint8Array(this.counter, this.counterArray)
    }
}