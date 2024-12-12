import {showSaveFilePicker} from "native-file-system-adapter";

/**
 * Create a file readable stream from a file picker
 *
 * @param filename - The suggested filename
 * @param filesize - The size of the file
 */
export async function createDownloadWritableStream(filename: string, filesize: number): Promise<WritableStream> {
    const extension = filename.split('.').pop()

    const handle = await showSaveFilePicker({
        suggestedName: filename,
        // @ts-ignore
        startIn: "downloads",
        types: [{
            accept: {"application/octet-stream": [`.${extension}`]}
        }]
    })

    return handle.createWritable({
        // @ts-ignore
        size: filesize
    })
}