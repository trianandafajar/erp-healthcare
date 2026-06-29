import { getDashboardPath } from '~/utils/roleRedirect'

export default defineNuxtRouteMiddleware(async (to) => {
    if (to.path === '/reset-password') return

    const authState = await ensureAuthState()
    if (!authState?.user && import.meta.server) return
    if (!authState?.user) return

    return navigateTo(getDashboardPath(authState.role), { replace: true })
})
