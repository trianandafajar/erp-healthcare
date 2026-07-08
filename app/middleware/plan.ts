export default defineNuxtRouteMiddleware(async (to) => {
    const feature = to.meta.requiredFeature as string | undefined
    if (!feature) return

    const { plan, load, hasFeature } = usePlan()
    await load()

    if (!hasFeature(feature)) {
        const label = (to.meta.featureLabel as string) ?? feature
        return navigateTo(`/upgrade?feature=${feature}&label=${encodeURIComponent(label)}`, { replace: true })
    }
})
