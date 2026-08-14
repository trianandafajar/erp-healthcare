import { describe, it, expect } from 'vitest'
import { hexToRgb, getContrastText, isValidHex } from '../color'

describe('hexToRgb', () => {
    it('converts hex to rgb channels', () => {
        expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
        expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 })
        expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 })
        expect(hexToRgb('#176D37')).toEqual({ r: 0x17, g: 0x6d, b: 0x37 })
        expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 })
    })
})

describe('isValidHex', () => {
    it('accepts 6-digit hex colors', () => {
        expect(isValidHex('#ffffff')).toBe(true)
        expect(isValidHex('#ABC123')).toBe(true)
        expect(isValidHex('#176D37')).toBe(true)
    })

    it('rejects malformed colors', () => {
        expect(isValidHex('ffffff')).toBe(false)
        expect(isValidHex('#fff')).toBe(false)
        expect(isValidHex('#gggggg')).toBe(false)
        expect(isValidHex('#12345')).toBe(false)
        expect(isValidHex('')).toBe(false)
    })
})

describe('getContrastText', () => {
    it('returns dark text for light backgrounds', () => {
        expect(getContrastText('#ffffff')).toBe('#1a1a1a')
        expect(getContrastText('#f0f0f0')).toBe('#1a1a1a')
    })

    it('returns white text for dark backgrounds', () => {
        expect(getContrastText('#000000')).toBe('#FFFFFF')
        expect(getContrastText('#176D37')).toBe('#FFFFFF')
        expect(getContrastText('#123456')).toBe('#FFFFFF')
    })
})
