import {z} from "zod"
import {EncryptedValueSchema} from "./encryptedvalue"

export const FileMetadataSchema = z.object({
    name: EncryptedValueSchema,
    /**
     * Legacy property that contains an encrypted MD5 checksum.
     * Replaced by `checksums`.
     */
    checksum: EncryptedValueSchema.optional(),
    /**
     * Contains key/value pairs of the algorithm and an encrypted checksum.
     */
    checksums: z.record(z.string(), EncryptedValueSchema).optional(),
    /**
     * base64-encoded initialization vector used to encrypt the file.
     */
    iv: z.base64().nonempty(),
    /**
     * Size of the file in bytes.
     */
    size: z.number(),
})

/**
 * Defines the metadata of a file.
 */
export type FileMetadata = z.infer<typeof FileMetadataSchema>