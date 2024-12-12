import {decrypt, decryptToString, importIv, importKey} from "./utils/crypto";
import {uint8ArrayToHex} from "uint8array-extras";

export class DownloadInfo {
    name: string
    checksum: string
    url: string
    size: number
    key: CryptoKey
    iv: bigint

    constructor(name: string, checksum: string, url: string, size: number, key: CryptoKey, iv: bigint) {
        this.name = name
        this.checksum = checksum
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
    const checksum = uint8ArrayToHex(await decrypt(fileInfo.metadata.checksum, key))
    const iv = importIv(fileInfo.metadata.iv)
    return new DownloadInfo(name, checksum, fileInfo.url, fileInfo.metadata.size, key, iv)
}