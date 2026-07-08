const GUEST_ROUTES = ['/', '/login', '/register', '/forgot-password']

export default defineNuxtPlugin(async () => {
    if (import.meta.server) return

    const authState = await ensureAuthState().catch(() => null)

    if (authState?.user && GUEST_ROUTES.includes(useRoute().path)) {
        const authStore = useAuthStore()
        await navigateTo(getDashboardPath(authState.role, authStore.tenantSlug), { replace: true })
    }
})
