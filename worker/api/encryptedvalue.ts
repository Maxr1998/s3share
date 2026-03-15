import {z} from "zod"

export const EncryptedValueSchema = z.object({
    /**
     * base64-encoded ciphertext of the value.
     */
    value: z.string(),
    /**
     * base64-encoded initialization vector.
     */
    iv: z.string(),
})

/**
 * Defines an encrypted value and its associated IV.
 */
export type EncryptedValue = z.infer<typeof EncryptedValueSchema>