import { getDashboardPath } from '~/utils/roleRedirect'

export default defineNuxtRouteMiddleware(async (to) => {
    if (to.path === '/reset-password' || to.path.startsWith('/verify')) return

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

                let tenantId: string | null = null
                let tenantSlug: string | null = null
                let subscriptionPlan: string | null = null
                let settings: { logo_url?: string | null } | null = null
                let emailVerified = false
                if (role && role !== 'superadmin') {
                    const { data: profile, error: profileErr } = await supabase
                        .from('profiles')
                        .select('tenant_id, email_verified, tenants(slug, subscription_plan)')
                        .eq('id', user.id)
                        .single()

                    if (!profileErr && profile) {
                        const p = profile as any
                        emailVerified = p.email_verified ?? false
                        tenantId = p.tenant_id ?? null
                        tenantSlug = p?.tenants?.slug ?? null
                        subscriptionPlan = p?.tenants?.subscription_plan ?? null

                        if (p.tenant_id) {
                            const { data: sData } = await supabase
                                .from('tenant_settings')
                                .select('logo_url')
                                .eq('tenant_id', p.tenant_id)
                                .maybeSingle()
                            settings = sData as { logo_url?: string | null } | null
                        }
                    }
                }

                if (!emailVerified && role !== 'superadmin') {
                    return navigateTo(`/verify?email=${encodeURIComponent(user.email ?? '')}`, { replace: true })
                }

                const authStore = useAuthStore()
                authStore.setUser({
                    user,
                    role,
                    permissions: [],
                    tenantId,
                    tenantSlug,
                    subscriptionPlan: subscriptionPlan ?? 'starter',
                })

                if (!role || role === 'superadmin') {
                    return navigateTo(getDashboardPath(role, tenantSlug), { replace: true })
                }

                const onboardingPath = getOnboardingPath(tenantId, subscriptionPlan, settings, tenantSlug, role)
                if (onboardingPath) {
                    return navigateTo(onboardingPath, { replace: true })
                }

                return navigateTo(getDashboardPath(role, tenantSlug), { replace: true })
            }
        } catch {}
        return
    }

    const authState = await ensureAuthState()
    if (!authState?.user) return

    const authStore = useAuthStore()
    const impersonationStack = useCookie<any[]>('impersonation_meta_stack', { default: () => [] })
    const isImpersonating = (impersonationStack.value?.length ?? 0) > 0

    if (authState.role !== 'superadmin' && !isImpersonating) {
        if (!authState.emailVerified) {
            return navigateTo(`/verify?email=${encodeURIComponent(authState.user?.email ?? '')}`, { replace: true })
        }

        const onboardingPath = getOnboardingPath(
            authState.tenantId ?? authStore.tenantId,
            authState.subscriptionPlan ?? authStore.subscriptionPlan,
            authState.settings ?? null,
            authStore.tenantSlug,
            authStore.role
        )
        if (onboardingPath) {
            return navigateTo(onboardingPath, { replace: true })
        }
    }

    return navigateTo(getDashboardPath(authState.role, authStore.tenantSlug), { replace: true })
})
