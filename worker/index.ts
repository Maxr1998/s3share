import {download} from "./download/handler"

export default {
    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url)
        switch (url.pathname) {
            case '/download':
                return await download(url)
            default:
                return new Response(null, {
                    status: 404,
                    statusText: 'Not Found',
                })
        }
    },
}