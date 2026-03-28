import {z} from "zod"
import {FileMetadataSchema} from "./filemetadata"

export const FileInfoSchema = z.object({
    file_id: z.string(),
    metadata: FileMetadataSchema,
    /**
     * Pre-signed URL to download the file.
     */
    url: z.string(),
    last_modified: z.iso.datetime().optional(),
})

/**
 * Contains a file's ID, metadata, and a pre-signed download URL.
 */
export type FileInfo = z.infer<typeof FileInfoSchema>