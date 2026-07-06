import { useTheme } from 'vuetify'

export function useTenantTheme() {
    const theme = useTheme()
    const profileStore = useProfileStore()

    const brandColor = computed(() => profileStore.data?.tenant?.brand_color)

    function applyColor(color: string) {
        if (theme.themes.value?.light?.colors) {
            theme.themes.value.light.colors.primary = color
        }
    }

    watch(brandColor, (color) => {
        if (color) applyColor(color)
    }, { immediate: true })

    return { applyColor, brandColor }
}
