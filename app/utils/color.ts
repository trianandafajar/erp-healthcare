export function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  }
}

function toLinear(c: number) {
  const v = c / 255
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

export function getContrastText(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
  return luminance > 0.179 ? '#1a1a1a' : '#FFFFFF'
}

export function isValidHex(hex: string) {
  return /^#[0-9a-fA-F]{6}$/.test(hex)
}
