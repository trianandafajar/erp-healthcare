import { getDashboardPath } from '~/utils/roleRedirect'

export default defineNuxtRouteMiddleware(async (to) => {
    const feature = to.meta.requiredFeature as string | undefined
    if (!feature) return

    const { load, hasFeature } = usePlan()
    await load()

    if (!hasFeature(feature)) {
        const label = (to.meta.featureLabel as string) ?? feature
        const upgrade = useUpgradeStore()
        upgrade.show(feature, label)

        const auth = useAuthStore()
        return navigateTo(getDashboardPath(auth.role, auth.tenantSlug), { replace: true })
    }
})
