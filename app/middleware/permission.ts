export default defineNuxtRouteMiddleware(async (to) => {
    const authState = await ensureAuthState()
    if (!authState?.user) {
        if (import.meta.server) return
        return navigateTo('/login', { replace: true })
    }

    const required = to.meta.permissions as string[] | undefined
    if (!required || required.length === 0) return

    const hasAccess = required.every(permission => authState.permissions.includes(permission))
    if (!hasAccess) {
        return navigateTo('/403', { replace: true })
    }
})
