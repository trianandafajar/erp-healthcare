import { getAllowedRolesForPath } from '~/utils/rbac'
import { getDashboardPath } from '~/utils/roleRedirect'

export default defineNuxtRouteMiddleware(async (to) => {
    const result = await requireAuth(to.path)
    if (!result) return
    if (!result.ok) return navigateTo(result.redirect, { replace: true })

    const authStore = useAuthStore()
    const role = result.state.role ?? null

    const requiredRoles: string[] | null = Array.isArray(to.meta.roles)
        ? to.meta.roles as string[]
        : to.meta.role
            ? [to.meta.role as string]
            : getAllowedRolesForPath(to.path)

    if (requiredRoles && !requiredRoles.includes(role)) {
        return navigateTo(getDashboardPath(role, authStore.tenantSlug) ?? '/403', { replace: true })
    }

    const permissions = to.meta.permissions as string[] | undefined
    if (permissions && permissions.length > 0) {
        const hasAccess = permissions.every(permission => result.state.permissions.includes(permission))
        if (!hasAccess) {
            return navigateTo('/403', { replace: true })
        }
    }

    const feature = to.meta.requiredFeature as string | undefined
    if (feature) {
        const { load, hasFeature } = usePlan()
        await load()

        if (!hasFeature(feature)) {
            const label = (to.meta.featureLabel as string) ?? feature
            const upgrade = useUpgradeStore()
            upgrade.show(feature, label)

            return navigateTo(getDashboardPath(authStore.role, authStore.tenantSlug) ?? '/403', { replace: true })
        }
    }
})