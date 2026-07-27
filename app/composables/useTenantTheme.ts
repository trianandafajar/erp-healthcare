import { useTheme } from 'vuetify'
import { useProfileStore } from '@/stores/profile'
import { hexToRgb, getContrastText, isValidHex } from '@/utils/color'

const DEFAULT_PRIMARY = '#176D37'
const DEFAULT_ON_PRIMARY = '#FFFFFF'

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

    function resetTheme() {
        if (theme.themes.value?.light?.colors) {
            theme.themes.value.light.colors.primary = DEFAULT_PRIMARY
            theme.themes.value.light.colors['on-primary'] = DEFAULT_ON_PRIMARY
        }
    }

    watch(brandColor, (color) => {
        if (color) {
            applyColor(color)
        } else {
            resetTheme()
        }
    }, { immediate: true })

    return { applyColor, brandColor }
}
