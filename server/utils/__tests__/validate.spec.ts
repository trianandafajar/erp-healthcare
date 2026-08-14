import { describe, it, expect } from 'vitest'
import {
    isNonEmptyString,
    isShortText,
    isUUID,
    isEmail,
    isDateYMD,
    isISO8601,
    isSlug,
    isEnum,
    isFiniteNumber,
    isInt,
    toFiniteNumber,
    toRequiredNumber,
    parsePositiveInt,
    pick,
} from '../validate'

describe('string type checkers', () => {
    it('isNonEmptyString', () => {
        expect(isNonEmptyString('a')).toBe(true)
        expect(isNonEmptyString('  ')).toBe(false)
        expect(isNonEmptyString('')).toBe(false)
        expect(isNonEmptyString(0)).toBe(false)
        expect(isNonEmptyString(null)).toBe(false)
    })

    it('isShortText', () => {
        expect(isShortText('abc', 5)).toBe(true)
        expect(isShortText('abcdef', 5)).toBe(false)
        expect(isShortText(123, 5)).toBe(false)
    })

    it('isUUID', () => {
        expect(isUUID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1')).toBe(true)
        expect(isUUID('AA1B2C3D-1111-1111-1111-111111111111')).toBe(true)
        expect(isUUID('not-a-uuid')).toBe(false)
        expect(isUUID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa')).toBe(false)
        expect(isUUID(123)).toBe(false)
    })

    it('isEmail', () => {
        expect(isEmail('a@b.co')).toBe(true)
        expect(isEmail('admin@demo.local')).toBe(true)
        expect(isEmail('plain')).toBe(false)
        expect(isEmail('a@b')).toBe(false)
        expect(isEmail('a@b@c.co')).toBe(false)
        expect(isEmail('')).toBe(false)
    })

    it('isDateYMD', () => {
        expect(isDateYMD('2026-08-14')).toBe(true)
        expect(isDateYMD('2026-13-01')).toBe(false)
        expect(isDateYMD('14/08/2026')).toBe(false)
        expect(isDateYMD('2026-8-1')).toBe(false)
    })

    it('isISO8601', () => {
        expect(isISO8601('2026-08-14T10:00:00Z')).toBe(true)
        expect(isISO8601('2026-08-14')).toBe(true)
        expect(isISO8601('garbage')).toBe(false)
    })

    it('isSlug', () => {
        expect(isSlug('my-clinic')).toBe(true)
        expect(isSlug('a1')).toBe(true)
        expect(isSlug('My-Clinic')).toBe(false)
        expect(isSlug('-no')).toBe(false)
        expect(isSlug('no-')).toBe(false)
    })

    it('isEnum', () => {
        expect(isEnum('waiting', ['waiting', 'done'])).toBe(true)
        expect(isEnum('cancelled', ['waiting', 'done'])).toBe(false)
        expect(isEnum(1, ['1'])).toBe(false)
    })
})

describe('number checkers', () => {
    it('isFiniteNumber', () => {
        expect(isFiniteNumber(5)).toBe(true)
        expect(isFiniteNumber(NaN)).toBe(false)
        expect(isFiniteNumber('5')).toBe(false)
    })

    it('isInt respects min/max bounds', () => {
        expect(isInt(5)).toBe(true)
        expect(isInt(5.5)).toBe(false)
        expect(isInt(5, { min: 0, max: 10 })).toBe(true)
        expect(isInt(11, { min: 0, max: 10 })).toBe(false)
        expect(isInt(-1, { min: 0, max: 10 })).toBe(false)
    })

    it('toFiniteNumber', () => {
        expect(toFiniteNumber('5')).toBe(5)
        expect(toFiniteNumber(5)).toBe(5)
        expect(toFiniteNumber('abc')).toBeNull()
        expect(toFiniteNumber('abc', 7)).toBe(7)
        expect(toFiniteNumber('', 7)).toBe(7)
        expect(toFiniteNumber(undefined)).toBeNull()
    })

    it('toRequiredNumber throws for invalid input', () => {
        expect(toRequiredNumber('5', 'count')).toBe(5)
        expect(() => toRequiredNumber('x', 'count')).toThrow()
    })

    it('parsePositiveInt', () => {
        expect(parsePositiveInt('10', 'page', 1)).toBe(10)
        expect(parsePositiveInt(undefined, 'page', 1)).toBe(1)
        expect(() => parsePositiveInt('0', 'page', 1)).toThrow()
        expect(() => parsePositiveInt('-5', 'page', 1)).toThrow()
        expect(() => parsePositiveInt('2.5', 'page', 1)).toThrow()
    })
})

describe('pick', () => {
    it('picks only allowed keys', () => {
        const body = { name: 'A', age: 3, secret: true }
        expect(pick(body, ['name', 'age'])).toEqual({ name: 'A', age: 3 })
    })

    it('skips undefined values', () => {
        expect(pick({ a: undefined, b: 1 }, ['a', 'b'])).toEqual({ b: 1 })
    })

    it('returns empty object for no matches', () => {
        expect(pick({ a: 1 }, ['z'])).toEqual({})
    })
})
