import {decryptToHex, decryptToString} from "./crypto/utils"
import type {FileInfo} from "../worker/api/fileinfo"
import {importIv, importKey} from "./crypto/key";
import type {EncryptedValue} from "../worker/api/encryptedvalue";

export class DownloadInfo {
    name: string
    checksums: Map<string, string>
    url: string
    size: number
    key: CryptoKey
    iv: bigint

    constructor(name: string, checksums: Map<string, string>, url: string, size: number, key: CryptoKey, iv: bigint) {
        this.name = name
        this.checksums = checksums
        this.url = url
        this.size = size
        this.key = key
        this.iv = iv
    }
}

const FILE_NOT_FOUND = "Invalid URL - the link you are trying to access does not exist."
const INVALID_KEY = "Invalid decryption key - please ensure you copied the full, correct link."

export async function loadDownloadInfo(): Promise<DownloadInfo> {
    const path = window.location.pathname
    const hash = window.location.hash
    if (!path || !hash) {
        return Promise.reject(FILE_NOT_FOUND)
    }

    const fileId = path.slice(1) // strip slash
    const keyString = hash.slice(1) // strip #
    const key = await importKey(keyString).catch(() => Promise.reject(INVALID_KEY))

    // Fetch file info
    const fileInfo: FileInfo = await fetch(`/download?file=${fileId}`).then((response) => {
        if (!response.ok) {
            return Promise.reject(FILE_NOT_FOUND)
        }
        return response.json()
    })

    const name = await decryptToString(fileInfo.metadata.name, key)
    const checksums = await decryptChecksums(fileInfo, key)
    const iv = importIv(fileInfo.metadata.iv)
    return new DownloadInfo(name, checksums, fileInfo.url, fileInfo.metadata.size, key, iv)
}

async function decryptChecksums(fileInfo: FileInfo, key: CryptoKey): Promise<Map<string, string>> {
    const checksumPromises: Promise<[string, string]>[] = []

    const append = (alg: string, checksum: EncryptedValue) => {
        checksumPromises.push(decryptToHex(checksum, key).then(d => [alg, d]))
    }

    if (fileInfo.metadata.checksum) {
        append("MD5", fileInfo.metadata.checksum)
    }

    if (fileInfo.metadata.checksums) {
        for (const [alg, encrypted] of Object.entries(fileInfo.metadata.checksums)) {
            append(alg, encrypted)
        }
    }

    return new Map<string, string>(await Promise.all(checksumPromises))
}