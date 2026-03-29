import type {FileMetadata} from "../../worker/api/filemetadata"
import {AES_BLOCK_SIZE} from "../crypto/constants"
import {FileEncryptor} from "../crypto/encryptor"
import {exportIv, generateIv} from "../crypto/key"
import {encryptFromString} from "../crypto/utils"
import type {ProgressTracker} from "../utils/progress"
import {completeUpload, prepareUpload, requestParts} from "./api"
import {HashManager} from "./hasher"
import type {EncryptionKey} from "./url"

const MIN_PART_SIZE = 5 * 1024 * 1024
const MAX_PART_COUNT = 10_000

const UPLOAD_BATCH_SIZE = 10

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
        private progressTracker: ProgressTracker,
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

    private calculatePartSize(fileSize: number): number {
        const minPartSizeForMaxCount = Math.ceil(fileSize / MAX_PART_COUNT)
        if (minPartSizeForMaxCount <= MIN_PART_SIZE) {
            return MIN_PART_SIZE
        }
        return Math.ceil(minPartSizeForMaxCount / AES_BLOCK_SIZE) * AES_BLOCK_SIZE
    }

    async upload() {
        const sessionKey = this.sessionKey
        const hashManager = this.hashManager

        const fileSize = this.file.size
        const partSize = this.calculatePartSize(fileSize)
        const totalParts = Math.ceil(fileSize / partSize)

        let batchStart = 1
        while (batchStart <= totalParts) {
            const count = Math.min(UPLOAD_BATCH_SIZE, totalParts - batchStart + 1)
            const parts = await requestParts(this.uploadToken, sessionKey, batchStart, count)

            for (const part of parts) {
                const start = (part.part - 1) * partSize
                const end = Math.min(start + partSize, fileSize)

                const plaintext = await this.file.slice(start, end).bytes()

                hashManager.update(plaintext)

                const isLastPart = end === fileSize
                const ciphertext = isLastPart
                    ? await this.fileEncryptor.encryptFinal(plaintext)
                    : await this.fileEncryptor.encrypt(plaintext)

                const partResponse = await fetch(part.url, {
                    method: "PUT",
                    body: ciphertext,
                })

                if (!partResponse.ok) throw new Error("Failed to upload part")
                const etag = partResponse.headers.get("Etag")
                if (!etag) throw new Error("Failed to upload part")
                this.etags.push(etag.replace(/^"|"$/g, ''))

                this.progressTracker.update(end - start)
            }

            batchStart += count
        }

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