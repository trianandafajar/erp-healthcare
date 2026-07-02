export default defineNuxtRouteMiddleware(async (to) => {
    const slug = to.params.slug as string | undefined
    if (!slug) return

    const authStore = useAuthStore()

    if (authStore.tenantSlug === slug && authStore.tenantId) return

    const supabase = useSupabase()
    if (!supabase) {
        throw createError({ statusCode: 500, statusMessage: 'Supabase client is not initialized' })
    }
    const { data: tenant, error } = await supabase
        .from('tenants')
        .select('id, slug')
        .eq('slug', slug)
        .single()

    if (error || !tenant) {
        throw createError({ statusCode: 404, statusMessage: `Tenant with slug "${slug}" not found` })
    }

    if (authStore.user && authStore.tenantSlug && authStore.tenantSlug !== slug) {
        return navigateTo('/403', { replace: true })
    }

    authStore.tenantId = tenant.id
    authStore.tenantSlug = tenant.slug
})