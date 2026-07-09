export const useUpgradeStore = defineStore('upgrade', () => {
    const shown = ref(false)
    const feature = ref('')
    const label = ref('')

    function show(featureKey: string, featureLabel: string) {
        feature.value = featureKey
        label.value = featureLabel
        shown.value = true
    }

    function dismiss() {
        shown.value = false
        feature.value = ''
        label.value = ''
    }

    return { shown, feature, label, show, dismiss }
})