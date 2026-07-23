type FeatureRow = {
    id: string
    plan: string
    feature_key: string
    feature_label: string
    feature_category: 'feature' | 'limit' | 'role'
    is_available: boolean
    limit_value: number | null
}

const cache = ref<Record<string, FeatureRow[]>>({})
const loading = ref(false)

export function usePlan() {
    const auth = useAuthStore()
    const profileStore = useProfileStore()
// console.log("profileStore:", profileStore.settings, profileStore.profile, profileStore.tenant, profileStore.roles)
    const plan = computed(() => profileStore.tenant?.subscription_plan ?? 'starter')

    const features = computed(() => cache.value[plan.value] ?? [])

    async function load() {
        if (cache.value[plan.value]) return
        if (loading.value) return
        loading.value = true
        try {
            const data = await $fetch<{ features: FeatureRow[] }>(`/api/plan-features?plan=${plan.value}`)
            for (const f of data.features) {
                if (!cache.value[f.plan]) cache.value[f.plan] = []
                cache.value[f.plan].push(f)
            }
        } catch {
            // fallback silent
        } finally {
            loading.value = false
        }
    }

    function hasFeature(key: string): boolean {
        if (plan.value === 'enterprise') return true
        const f = features.value.find((x) => x.feature_key === key && x.feature_category === 'feature')
        return f?.is_available ?? false
    }

    function hasRole(key: string): boolean {
        if (plan.value === 'enterprise') return true
        const f = features.value.find((x) => x.feature_key === key && x.feature_category === 'role')
        return f?.is_available ?? false
    }

    function getLimit(key: string): number {
        const f = features.value.find((x) => x.feature_key === key && x.feature_category === 'limit')
        if (!f) return 0
        return f.limit_value ?? -1
    }

    function isUnlimited(key: string): boolean {
        return getLimit(key) === -1
    }

    const currentPlanFeatures = computed(() =>
        features.value.filter((f) => f.feature_category === 'feature' && f.is_available)
    )

    return {
        plan,
        load,
        hasFeature,
        hasRole,
        getLimit,
        isUnlimited,
        currentPlanFeatures,
    }
}
