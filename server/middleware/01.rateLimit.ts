import { enforceRateLimit, type RateLimitOptions } from '~~/server/utils/rateLimit'

const LOGIN_LIMITS: RateLimitOptions = { limit: 10, windowMs: 60_000 }
const EMAIL_LIMITS: RateLimitOptions = { limit: 5, windowMs: 60_000 }
const PUBLIC_LIMITS: RateLimitOptions = { limit: 10, windowMs: 60_000 }
const DEFAULT_LIMITS: RateLimitOptions = { limit: 300, windowMs: 60_000 }

const routeLimits: Array<{ prefix: string; options: RateLimitOptions }> = [
    { prefix: '/api/auth/login', options: LOGIN_LIMITS },
    { prefix: '/api/auth/register', options: LOGIN_LIMITS },
    { prefix: '/api/auth/verify-email-otp', options: LOGIN_LIMITS },
    { prefix: '/api/auth/superadmin-instant-login', options: EMAIL_LIMITS },
    { prefix: '/api/auth/send-verification-otp', options: EMAIL_LIMITS },
    { prefix: '/api/auth/forgot-password', options: EMAIL_LIMITS },
    { prefix: '/api/auth/reset-password', options: EMAIL_LIMITS },
    { prefix: '/api/auth/verify-reset-token', options: EMAIL_LIMITS },
    { prefix: '/api/contact/send', options: PUBLIC_LIMITS },
    { prefix: '/api/call-bookings', options: PUBLIC_LIMITS },
    { prefix: '/api/public-booking', options: PUBLIC_LIMITS },
]

function matchRouteLimits(path: string): RateLimitOptions | null {
    for (const rule of routeLimits) {
        if (path === rule.prefix || path.startsWith(`${rule.prefix}/`)) {
            return rule.options
        }
    }
    return null
}

export default defineEventHandler(async (event) => {
    const method = event.method?.toUpperCase()
    if (method === 'OPTIONS') return

    const path = (event.path || '').split('?')[0]
    if (!path.startsWith('/api/')) return

    const matched = matchRouteLimits(path)
    if (matched) {
        await enforceRateLimit(event, matched)
        return
    }

    await enforceRateLimit(event, DEFAULT_LIMITS)
})
