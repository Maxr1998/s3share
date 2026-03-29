import {z} from "zod"
import {FileMetadataSchema} from "./filemetadata"

export type UploadPart = {
    part: number
    url: string
}

const UploadTokenRequestSchema = z.object({
    token: z.string().nonempty(),
})

export const CheckUploadTokenRequestSchema = UploadTokenRequestSchema

export type CheckUploadTokenRequest = z.infer<typeof CheckUploadTokenRequestSchema>

export const CheckUploadTokenResponseSchema = z.object({
    in_progress: z.boolean(),
})

export type CheckUploadTokenResponse = z.infer<typeof CheckUploadTokenResponseSchema>

export const UploadCreateRequestSchema = UploadTokenRequestSchema

export type UploadCreateRequest = z.infer<typeof UploadCreateRequestSchema>

export const UploadCreateResponseSchema = z.object({
    session_key: z.string().nonempty(),
})

export type UploadCreateResponse = z.infer<typeof UploadCreateResponseSchema>

export const SessionRequestSchema = UploadTokenRequestSchema.extend({
    session_key: z.string().nonempty(),
})

export type SessionRequest = z.infer<typeof SessionRequestSchema>

export const UploadPartsRequestSchema = SessionRequestSchema.extend({
    part: z.int().positive().default(1),
    count: z.int().positive().max(50).default(1),
}).refine(req => req.part + req.count - 1 <= 10000, {
    message: "You can only request up to 10,000 parts in total.",
    path: ["part", "count"],
})

export type UploadPartsRequest = z.infer<typeof UploadPartsRequestSchema>

export const UploadCompleteRequestSchema = SessionRequestSchema.extend({
    metadata: FileMetadataSchema,
    etags: z.array(z.string()).max(10000),
})

export type UploadCompleteRequest = z.infer<typeof UploadCompleteRequestSchema>

export const UploadCompleteResponseSchema = z.object({
    file_id: z.string().nonempty(),
})

export type UploadCompleteResponse = z.infer<typeof UploadCompleteResponseSchema>