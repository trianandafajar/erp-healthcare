import { createStorage } from 'unstorage'
import { memoryDriver } from 'unstorage/drivers/memory'

let storage: ReturnType<typeof createStorage> | null = null

function getStorage() {
    if (!storage) storage = createStorage({ driver: memoryDriver() })
    return storage
}

export interface RateLimitOptions {
    limit: number
    windowMs: number
    keyPrefix?: string
}

const DEFAULT_OPTIONS: RateLimitOptions = { limit: 120, windowMs: 60_000 }

export function getClientIp(event: any): string {
    const forwarded = getHeader(event, 'x-forwarded-for')
    if (typeof forwarded === 'string' && forwarded.trim()) {
        const first = forwarded.split(',')[0]?.trim()
        if (first) return first
    }
    const real = getHeader(event, 'x-real-ip')
    if (typeof real === 'string' && real.trim()) return real.trim()
    const remote = event.node?.req?.socket?.remoteAddress
    return remote || 'unknown'
}

export async function enforceRateLimit(event: any, options: Partial<RateLimitOptions> = {}): Promise<void> {
    const { limit, windowMs, keyPrefix = 'api' } = { ...DEFAULT_OPTIONS, ...options }
    const ip = getClientIp(event)
    const key = `ratelimit:${keyPrefix}:${ip}`
    const now = Date.now()

    const store = getStorage()
    const entry = await store.getItem<{ count: number; resetAt: number }>(key)

    let count: number
    let resetAt: number
    if (entry && entry.resetAt > now) {
        count = entry.count + 1
        resetAt = entry.resetAt
    } else {
        count = 1
        resetAt = now + windowMs
    }

    const remaining = Math.max(0, limit - count)
    const headers = {
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(remaining),
    }

    if (count > limit) {
        const retryAfter = Math.ceil((resetAt - now) / 1000)
        setResponseHeaders(event, { ...headers, 'Retry-After': String(retryAfter) })
        throw createError({
            statusCode: 429,
            statusMessage: 'Too Many Requests',
            message: 'Too many requests. Please try again later.',
        })
    }

    await store.setItem(key, { count, resetAt })
    setResponseHeaders(event, headers)
}
