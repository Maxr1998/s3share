export type AppRoute = "download" | "upload" | "admin"

export function parseRoute(pathname: string): AppRoute {
    if (pathname.startsWith("/upload/")) {
        return "upload"
    } else if (pathname === "/admin" || pathname.startsWith("/admin/")) {
        return "admin"
    }
    return "download"
}