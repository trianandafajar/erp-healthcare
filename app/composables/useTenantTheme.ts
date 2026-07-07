import { useTheme } from 'vuetify'
import { useProfileStore } from '@/stores/profile'

function hexToRgb(hex: string) {
    const h = hex.replace('#', '')
    return {
        r: parseInt(h.substring(0, 2), 16),
        g: parseInt(h.substring(2, 4), 16),
        b: parseInt(h.substring(4, 6), 16),
    }
}

function getContrastText(hex: string) {
    const { r, g, b } = hexToRgb(hex)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#1a1a1a' : '#FFFFFF'
}

function isValidHex(hex: string) {
    return /^#[0-9a-fA-F]{6}$/.test(hex)
}

export function useTenantTheme() {
    const theme = useTheme()
    const profileStore = useProfileStore()

    const brandColor = computed(() => profileStore.data?.tenant?.brand_color)

    function applyColor(color: string) {
        if (!isValidHex(color)) return
        if (theme.themes.value?.light?.colors) {
            theme.themes.value.light.colors.primary = color
            theme.themes.value.light.colors['on-primary'] = getContrastText(color)
        }
    }

    watch(brandColor, (color) => {
        if (color) applyColor(color)
    }, { immediate: true })

    return { applyColor, brandColor }
}
