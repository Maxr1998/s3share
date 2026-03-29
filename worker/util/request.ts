import {z} from "zod"
import {methodNotAllowed, textResponse} from "./response"

export function hasMethod(request: Request, method: string): boolean {
    return request.method.toUpperCase() === method
}

export async function handlePostJson<T>(
    request: Request,
    schema: z.ZodType<T>,
    handler: (body: T) => Promise<Response>,
): Promise<Response> {
    if (!hasMethod(request, 'POST')) {
        return methodNotAllowed('POST')
    }

    const raw = await requestJson(request)
    if (raw instanceof Response) {
        return raw
    }

    const parsed = schema.safeParse(raw)
    if (!parsed.success) {
        return textResponse(400, "Bad Request", parsed.error.message)
    }

    return await handler(parsed.data)
}

async function requestJson(request: Request): Promise<unknown | Response> {
    const contentType = request.headers.get('Content-Type')?.toLowerCase() ?? ''
    if (!contentType.includes('application/json')) {
        return textResponse(415, 'Unsupported Media Type', 'Expected content type application/json')
    }

    try {
        return await request.json()
    } catch {
        return textResponse(400, 'Bad Request', 'Invalid JSON body')
    }
}