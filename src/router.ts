export type AppRoute = "download" | "upload"

export function parseRoute(pathname: string): AppRoute {
    if (pathname.startsWith("/upload/")) {
        return "upload"
    }
    return "download"
}