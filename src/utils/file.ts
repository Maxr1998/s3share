import {showOpenFilePicker, showSaveFilePicker} from "native-file-system-adapter"

/**
 * Create a file readable stream from a file picker
 *
 * @param filename - The suggested filename
 * @param filesize - The size of the file
 */
export async function createDownloadWritableStream(filename: string, filesize: number): Promise<WritableStream> {
    const extension = filename.split('.').pop()

    const types = []
    if (extension && extension.length > 0) {
        types.push({accept: {"application/octet-stream": [`.${extension}`]}})
    }

    const handle = await showSaveFilePicker({
        suggestedName: filename,
        // @ts-ignore startIn is available in browsers, but not in this adapter type definition
        startIn: "downloads",
        types: types,
    })

    return handle.createWritable({
        // @ts-ignore
        size: filesize,
    })
}

/**
 * Open a file picker and return a single file for upload.
 *
 * Returns null when the user cancels the picker.
 */
export async function pickUploadFile(): Promise<File | null> {
    try {
        const [handle] = await showOpenFilePicker({
            multiple: false,
            // @ts-ignore startIn is available in browsers, but not in this adapter type definition
            startIn: "downloads"
        })

        if (!handle) {
            return null
        }

        return await handle.getFile()
    } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
            return null
        }
        throw e
    }
}
