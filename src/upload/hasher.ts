import {createBLAKE3, createMD5, createSHA256, type IHasher} from "hash-wasm"
import type {EncryptedValue} from "../../worker/api/encryptedvalue"
import {encrypt} from "../crypto/utils"

const factories = {
    BLAKE3: createBLAKE3,
    SHA256: createSHA256,
    MD5: createMD5,
}

export class HashManager {
    private readonly hashers: Record<string, IHasher>

    private constructor(hashers: Record<string, IHasher>) {
        this.hashers = hashers
    }

    static async create(): Promise<HashManager> {
        const hashers = await Promise.all(
            Object.entries(factories).map(async ([name, factory]) =>
                [name, await factory()] as const,
            ),
        )
        return new HashManager(Object.fromEntries(hashers))
    }

    update(data: Uint8Array<ArrayBufferLike>) {
        for (const hasher of Object.values(this.hashers)) {
            hasher.update(data)
        }
    }

    async digest(key: CryptoKey): Promise<Record<string, EncryptedValue>> {
        // TODO: parallelize awaits
        const result: Record<string, EncryptedValue> = {}
        for (const [name, hasher] of Object.entries(this.hashers)) {
            result[name] = await this.digestHasher(hasher, key)
        }
        return result
    }

    private async digestHasher(hasher: IHasher, key: CryptoKey): Promise<EncryptedValue> {
        return await encrypt(hasher.digest("binary"), key)
    }
}