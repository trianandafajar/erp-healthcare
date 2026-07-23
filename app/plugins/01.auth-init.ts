const GUEST_ROUTES = ['/', '/login', '/register', '/forgot-password']

export default defineNuxtPlugin(async () => {
    if (import.meta.server) return

    const authState = await ensureAuthState().catch(() => null)

    if (authState?.user && GUEST_ROUTES.includes(useRoute().path)) {
        const authStore = useAuthStore()
        const impersonationMeta = useCookie('impersonation_meta', { default: () => null })
        const isImpersonating = !!impersonationMeta.value

        if (authState.role !== 'superadmin' && !isImpersonating) {
            const onboardingPath = getOnboardingPath(
                authState.tenantId ?? authStore.tenantId,
                authState.subscriptionPlan ?? authStore.subscriptionPlan,
                authState.settings ?? null,
                authStore.tenantSlug,
                authState.role
            )
            if (onboardingPath) {
                await navigateTo(onboardingPath, { replace: true })
                return
            }
        }

        await navigateTo(getDashboardPath(authState.role, authStore.tenantSlug), { replace: true })
    }
})
