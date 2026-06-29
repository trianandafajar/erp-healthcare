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

    const redirectMap: Record<string, string> = {
        admin: '/dashboard',
        doctor: '/doctor/dashboard',
        specialist: '/doctor/dashboard',
        pharmacy: '/pharmacy/dashboard',
        nurse: '/nurse/dashboard',
        receptionist: '/receptionist/dashboard',
        patient: '/patient/dashboard',
    }

    return navigateTo(redirectMap[role ?? ''] ?? '/dashboard', { replace: true })
})
