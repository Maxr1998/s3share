export function textResponse(status: number, statusText: string, body: string): Response {
    return new Response(body, {
        status: status,
        statusText: statusText,
        headers: {
            'Content-Type': 'text/plain',
        },
    })
}

export function methodNotAllowed(allowedMethod: string): Response {
    return new Response(null, {
        status: 405,
        statusText: 'Method Not Allowed',
        headers: {
            Allow: allowedMethod,
        },
    })
}