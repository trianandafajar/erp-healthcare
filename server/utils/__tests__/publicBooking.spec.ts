import { describe, it, expect } from 'vitest'
import { toMinutes, toTimeStr, computeDoctorSlots, nowInTz } from '../publicBooking'

describe('toMinutes', () => {
    it('converts HH:MM to minutes', () => {
        expect(toMinutes('08:00')).toBe(480)
        expect(toMinutes('23:59')).toBe(1439)
        expect(toMinutes('00:00')).toBe(0)
    })

    it('handles nullish input', () => {
        expect(toMinutes(null)).toBe(0)
        expect(toMinutes(undefined)).toBe(0)
        expect(toMinutes('')).toBe(0)
    })
})

describe('toTimeStr', () => {
    it('converts minutes to HH:MM', () => {
        expect(toTimeStr(480)).toBe('08:00')
        expect(toTimeStr(0)).toBe('00:00')
        expect(toTimeStr(1439)).toBe('23:59')
        expect(toTimeStr(5)).toBe('00:05')
    })
})

describe('computeDoctorSlots', () => {
    const base = {
        startMin: 480,
        endMin: 600,
        duration: 30,
        bookedByTime: {},
        isToday: false,
        nowMin: -1,
    }

    it('generates slots across the window', () => {
        const slots = computeDoctorSlots(base)
        expect(slots).toEqual(['08:00', '08:30', '09:00', '09:30'])
    })

    it('skips already-booked times', () => {
        const slots = computeDoctorSlots({
            ...base,
            bookedByTime: { '08:30': 1 },
        })
        expect(slots).toEqual(['08:00', '09:00', '09:30'])
    })

    it('trims past slots when isToday', () => {
        const slots = computeDoctorSlots({
            ...base,
            isToday: true,
            nowMin: 495,
        })
        expect(slots).toEqual(['08:30', '09:00', '09:30'])
    })

    it('does not overflow beyond endMin', () => {
        const slots = computeDoctorSlots({ ...base, startMin: 565, endMin: 590 })
        expect(slots).toEqual([])
    })

    it('returns empty for duration below 5', () => {
        expect(computeDoctorSlots({ ...base, duration: 4 })).toEqual([])
        expect(computeDoctorSlots({ ...base, duration: 0 })).toEqual([])
    })

    it('returns empty when endMin <= startMin', () => {
        expect(computeDoctorSlots({ ...base, startMin: 600, endMin: 600 })).toEqual([])
        expect(computeDoctorSlots({ ...base, startMin: 620, endMin: 600 })).toEqual([])
    })
})

describe('nowInTz', () => {
    it('returns a valid dateKey and minutes', () => {
        const now = nowInTz()
        expect(now.dateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(now.minutes).toBeGreaterThanOrEqual(0)
        expect(now.minutes).toBeLessThan(1440)
    })

    it('honours a custom timezone', () => {
        const jakarta = nowInTz('Asia/Jakarta')
        expect(jakarta.dateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
})
