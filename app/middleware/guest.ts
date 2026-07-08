import { getDashboardPath } from '~/utils/roleRedirect'

export default defineNuxtRouteMiddleware(async (to) => {
    if (to.path === '/reset-password') return

    if (import.meta.server) {
        try {
            const supabase = useSupabase()
            if (!supabase) return

            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                const { data: roleData } = await supabase
                    .from('user_roles')
                    .select('roles(name)')
                    .eq('user_id', user.id)
                    .single()

                const role = (roleData as any)?.roles?.name ?? null

                let tenantSlug: string | null = null
                if (role && role !== 'superadmin') {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('tenants(slug)')
                        .eq('id', user.id)
                        .single()
                    tenantSlug = (profile as any)?.tenants?.slug ?? null
                }

                const authStore = useAuthStore()
                authStore.setUser({
                    user,
                    role,
                    permissions: [],
                    tenantSlug,
                })

                return navigateTo(getDashboardPath(role, tenantSlug), { replace: true })
            }
        } catch {}
        return
    }

    const authState = await ensureAuthState()
    if (!authState?.user) return

    const authStore = useAuthStore()
    return navigateTo(getDashboardPath(authState.role, authStore.tenantSlug), { replace: true })
})
