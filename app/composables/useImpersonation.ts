export const useImpersonation = () => {
    const supabase = useSupabase()
    const authStore = useAuthStore()
    const profileStore = useProfileStore()

    async function syncCurrentSessionProfile() {
        authStore.clearUser()
        profileStore.clearProfile()

        const currentProfile = await profileStore.fetchProfile(true).catch(() => null)
        if (!currentProfile?.user) return

        const primaryRole = currentProfile.roles?.[0] as any
        const permissions: string[] = primaryRole?.role_permissions
            ?.map((rp: any) => rp.permissions?.name)
            .filter(Boolean) ?? []

        authStore.setUser({
            user: currentProfile.user,
            role: primaryRole?.name ?? null,
            permissions,
            tenantId: currentProfile.tenant?.id ?? null,
            tenantSlug: currentProfile.tenant?.slug ?? null,
        })
    }

    const isImpersonating = computed(() => {
        if (import.meta.server) return false
        return !!localStorage.getItem('admin_session')
    })

    const impersonatedName = computed(() => {
        if (import.meta.server) return ''
        return localStorage.getItem('impersonated_name') ?? ''
    })

    const impersonatedRole = computed(() => {
        if (import.meta.server) return ''
        return localStorage.getItem('impersonated_role') ?? ''
    })

    async function loginAs(user: { id: string; name: string; role: string }) {
        if (!supabase) return

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        // Store actor's current role so exitImpersonation can redirect correctly
        const actorRole = authStore.role || 'admin'
        localStorage.setItem('admin_session', JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
        }))
        localStorage.setItem('impersonated_name', user.name)
        localStorage.setItem('impersonated_role', user.role)
        localStorage.setItem('impersonated_by_role', actorRole)

        try {
            const res = await $fetch<{ access_token: string; refresh_token: string }>(
                '/api/users/impersonate',
                { method: 'POST', body: { id: user.id } }
            )

            await supabase.auth.setSession({
                access_token: res.access_token,
                refresh_token: res.refresh_token,
            })

            await syncCurrentSessionProfile()
            const dashboard = getDashboardPath(authStore.role, authStore.tenantSlug)
            await navigateTo(dashboard)

        } catch (err: any) {
            localStorage.removeItem('admin_session')
            localStorage.removeItem('impersonated_name')
            localStorage.removeItem('impersonated_role')
            localStorage.removeItem('impersonated_by_role')
            throw err
        }
    }

    async function exitImpersonation() {
        const raw = localStorage.getItem('admin_session')
        if (!raw || !supabase) return

        const adminSession = JSON.parse(raw)

        await supabase.auth.setSession(adminSession)

        const actorRole = localStorage.getItem('impersonated_by_role') || 'admin'
        localStorage.removeItem('admin_session')
        localStorage.removeItem('impersonated_name')
        localStorage.removeItem('impersonated_role')
        localStorage.removeItem('impersonated_by_role')

        await syncCurrentSessionProfile()
        await navigateTo(actorRole === 'superadmin' ? '/super-admin/users-management' : '/users-management')
    }

    return {
        isImpersonating,
        impersonatedName,
        impersonatedRole,
        loginAs,
        exitImpersonation,
    }
}
