import { getAllowedRolesForPath } from '~/utils/rbac'
import { getDashboardPath } from '~/utils/roleRedirect'

export default defineNuxtRouteMiddleware(async (to) => {
    const result = await requireAuth(to.path)
    if (!result) return
    if (!result.ok) return navigateTo(result.redirect, { replace: true })

    const role = result.state.role ?? null
    const allowedRoles = getAllowedRolesForPath(to.path)

    if (!allowedRoles) return

    if (role && allowedRoles.includes(role)) return

    const authStore = useAuthStore()
    return navigateTo(getDashboardPath(role, authStore.tenantSlug), { replace: true })
})