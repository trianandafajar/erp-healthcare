const GUEST_ROUTES = ['/', '/login', '/register', '/forgot-password', '/verify']

export default defineNuxtPlugin(async () => {
    if (import.meta.server) return

    const authState = await ensureAuthState().catch(() => null)

    if (authState?.user && GUEST_ROUTES.includes(useRoute().path)) {
        const authStore = useAuthStore()
        const impersonationStack = useCookie<any[]>('impersonation_meta_stack', { default: () => [] })
        const isImpersonating = (impersonationStack.value?.length ?? 0) > 0

        if (authState.role !== 'superadmin' && !isImpersonating) {
            if (!authState.emailVerified) {
                await navigateTo(`/verify?email=${encodeURIComponent(authState.user?.email ?? '')}`, { replace: true })
                return
            }

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

        const dashboard = getDashboardPath(authState.role, authStore.tenantSlug ?? authState.tenantSlug)
        if (dashboard) {
            await navigateTo(dashboard, { replace: true })
        }
    }
})
