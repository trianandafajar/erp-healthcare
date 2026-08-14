function humanizeField(field: string): string {
    return field.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function badRequest(message: string) {
    return createError({ statusCode: 400, message })
}

// ---------- Type checkers (pure) ----------

export function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0
}

export function isShortText(value: unknown, max: number): boolean {
    return typeof value === 'string' && value.length <= max
}

export function isUUID(value: unknown): boolean {
    return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

export function isEmail(value: unknown): boolean {
    return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function isDateYMD(value: unknown): boolean {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))
}

export function isISO8601(value: unknown): boolean {
    return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

export function isSlug(value: unknown): boolean {
    return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
}

export function isEnum(value: unknown, values: readonly string[]): boolean {
    return typeof value === 'string' && values.includes(value)
}

export function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value)
}

export function isInt(value: unknown, { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = {}): boolean {
    return isFiniteNumber(value) && Number.isInteger(value) && value >= min && value <= max
}

// ---------- Body helpers ----------

export async function readBodyObject(event: any): Promise<Record<string, any>> {
    const raw = await readBody(event)
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
    return raw
}

export function requireFields(body: Record<string, any>, fields: string[]): void {
    const missing = fields.filter((f) => {
        const v = body[f]
        return v === undefined || v === null || v === ''
    })
    if (missing.length > 0) {
        const list = missing.map(humanizeField).join(', ')
        throw badRequest(`${list} ${missing.length > 1 ? 'are' : 'is'} required`)
    }
}

export function checkField(condition: boolean, message: string): void {
    if (!condition) throw badRequest(message)
}

export function checkFormat(condition: boolean, field: string, format: string): void {
    if (!condition) throw badRequest(`${humanizeField(field)} must be a valid ${format}`)
}

export function pick<T extends Record<string, any>>(body: T, allowed: readonly string[]): Partial<T> {
    const out: any = {}
    for (const key of allowed) {
        if (body[key] !== undefined) out[key] = body[key]
    }
    return out
}

// ---------- Numbers ----------

export function toFiniteNumber(value: unknown, fallback: number | null = null): number | null {
    if (value === undefined || value === null || value === '') return fallback
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
}

export function toRequiredNumber(value: unknown, field: string): number {
    const n = toFiniteNumber(value)
    if (n === null) throw badRequest(`${humanizeField(field)} must be a valid number`)
    return n
}

export function parsePositiveInt(value: unknown, name: string, fallback: number): number {
    if (value === undefined || value === null || value === '') return fallback
    const n = Number(value)
    if (!Number.isInteger(n) || n <= 0) {
        throw badRequest(`${humanizeField(name)} must be a positive integer`)
    }
    return n
}

// ---------- Error handling ----------

export function publicError(err: any, fallback: string, statusCode = 400): never {
    console.error(`[api] ${fallback}:`, err?.message ?? err)
    throw createError({ statusCode, message: fallback })
}
