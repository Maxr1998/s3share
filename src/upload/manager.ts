import type {FileMetadata} from "../../worker/api/filemetadata"
import {AES_BLOCK_SIZE} from "../crypto/constants"
import {FileEncryptor} from "../crypto/encryptor"
import {exportIv, generateIv} from "../crypto/key"
import {encryptFromString} from "../crypto/utils"
import {completeUpload, prepareUpload, requestParts} from "./api"
import {HashManager} from "./hasher"
import type {EncryptionKey} from "./url"

export class UploadManager {
    private readonly iv: bigint
    private readonly fileEncryptor: FileEncryptor
    private readonly etags: string[] = []

    private _sessionKey?: string
    private _hashManager?: HashManager
    private _fileId?: string

    constructor(
        private uploadToken: string,
        private encryptionKey: EncryptionKey,
        private file: File,
    ) {
        this.iv = generateIv()
        this.fileEncryptor = new FileEncryptor(encryptionKey.key, this.iv)
    }

    private get sessionKey(): string {
        if (!this._sessionKey) {
            throw new Error("Missing call to prepare() before accessing sessionKey")
        }
        return this._sessionKey
    }

    get downloadPath(): string {
        if (!this._fileId) {
            throw new Error("Upload not complete")
        }
        return `/${this._fileId}#${this.encryptionKey.keyString}`
    }

    private get hashManager(): HashManager {
        if (!this._hashManager) {
            throw new Error("Missing call to prepare() before accessing hashManager")
        }
        return this._hashManager
    }

    async prepare() {
        this._sessionKey = await prepareUpload(this.uploadToken)
        this._hashManager = await HashManager.create()
    }

    async upload() {
        const sessionKey = this.sessionKey
        const hashManager = this.hashManager

        let parts = await requestParts(this.uploadToken, sessionKey, 1, 10)


        const fileSize = this.file.size
        const partSize = AES_BLOCK_SIZE * 1024 * 1024 // calculate dynamically

        // TODO: request more parts as required

        for (const part of parts) {
            const start = (part.part - 1) * partSize
            if (start >= fileSize) {
                break
            }
            const end = Math.min(start + partSize, fileSize)

            const plaintext = await this.file.slice(start, end).bytes()

            hashManager.update(plaintext)

            const ciphertext = await this.fileEncryptor.encrypt(plaintext)

            const partResponse = await fetch(part.url, {
                method: "PUT",
                body: ciphertext,
            })

            const etag = partResponse.headers.get("Etag")
            if (!etag) {
                return Promise.reject("Failed to upload part")
            }

            this.etags.push(etag.slice(1, -1))
        }
    }

    async complete() {
        const ivString = exportIv(this.iv)

        const checksums = await this.hashManager.digest(this.encryptionKey.key)

        const fileMetadata: FileMetadata = {
            name: await encryptFromString(this.file.name, this.encryptionKey.key),
            iv: ivString,
            size: this.file.size,
            checksums: checksums,
        }

        const uploadResponse = await completeUpload(this.uploadToken, this.sessionKey, fileMetadata, this.etags)

        this._fileId = uploadResponse.file_id
    }
}