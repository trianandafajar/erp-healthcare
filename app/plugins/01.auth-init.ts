const GUEST_ROUTES = ['/', '/login', '/register', '/forgot-password']

export default defineNuxtPlugin(async () => {
    if (import.meta.server) return

    const authState = await ensureAuthState().catch(() => null)

    if (authState?.user && GUEST_ROUTES.includes(useRoute().path)) {
        const authStore = useAuthStore()

        if (authState.role !== 'superadmin') {
            const onboardingPath = getOnboardingPath(
                authState.tenantId ?? authStore.tenantId,
                authState.subscriptionPlan ?? authStore.subscriptionPlan,
                authState.settings ?? null,
                authStore.tenantSlug
            )
            if (onboardingPath) {
                await navigateTo(onboardingPath, { replace: true })
                return
            }
        }

        await navigateTo(getDashboardPath(authState.role, authStore.tenantSlug), { replace: true })
    }
})
