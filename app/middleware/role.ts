import { getDashboardPath } from '~/utils/roleRedirect'

export default defineNuxtRouteMiddleware(async (to) => {
    const authState = await ensureAuthState()
    if (!authState?.user) {
        if (import.meta.server) return
        return navigateTo('/login', { replace: true })
    }

    const role = authState.role
    const requiredRoles = to.meta.role
        ? [to.meta.role]
        : Array.isArray(to.meta.roles)
            ? to.meta.roles
            : null

    if (requiredRoles && requiredRoles.includes(role)) {
        return
    }

    const authStore = useAuthStore()
    return navigateTo(getDashboardPath(role, authStore.tenantSlug), { replace: true })
})
