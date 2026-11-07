import {env} from "cloudflare:workers"
import {createRemoteJWKSet, jwtVerify, type RemoteJWKSet} from "jose"

let jwks: RemoteJWKSet | undefined

export async function validateAccess(request: Request): Promise<boolean> {
    const teamDomain = env.ACCESS_TEAM_DOMAIN
    const audTag = env.ACCESS_AUD_TAG
    const adminEmail = env.ACCESS_ADMIN_EMAIL
    if (!teamDomain || !audTag || !adminEmail) {
        return false
    }

    const token = request.headers.get("cf-access-jwt-assertion")
    if (!token) {
        return false
    }

    jwks ??= createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`))

    try {
        const {payload} = await jwtVerify(token, jwks, {issuer: teamDomain, audience: audTag})
        return payload.email === adminEmail
    } catch (e) {
        console.warn('Access token verification failed', e)
        return false
    }
}