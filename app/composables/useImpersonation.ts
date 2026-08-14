export const useImpersonation = () => {
    const supabase = useSupabase()
    const authStore = useAuthStore()
    const profileStore = useProfileStore()

    const metaStack = useCookie<any[]>('impersonation_meta_stack', { default: () => [] })

    const currentMeta = computed(() => {
        const stack = metaStack.value
        return stack?.length ? stack[stack.length - 1] : null
    })
    const isImpersonating = computed(() => (metaStack.value?.length ?? 0) > 0)
    const impersonationDepth = computed(() => metaStack.value?.length ?? 0)
    const impersonatedName = computed(() => currentMeta.value?.name ?? '')
    const impersonatedRole = computed(() => currentMeta.value?.role ?? '')

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

    async function loginAs(user: { id: string; name: string; role: string }) {
        if (!supabase) return

        try {
            const router = useRouter()
            const returnTo = router.currentRoute.value.fullPath

            await $fetch('/api/users/impersonate/start', {
                method: 'POST',
                body: { id: user.id, return_to: returnTo },
            })

            await syncCurrentSessionProfile()
            const dashboard = getDashboardPath(authStore.role, authStore.tenantSlug)
            if (!dashboard) {
                await $fetch('/api/users/impersonate/stop', { method: 'POST' }).catch(() => {})
                await syncCurrentSessionProfile().catch(() => {})
                throw new Error('User tidak memiliki tenant/role yang valid. Login-as dibatalkan.')
            }
            await navigateTo(dashboard)
        } catch (err: any) {
            throw err
        }
    }

    async function exitImpersonation() {
        if (!supabase) return

        try {
            const current = currentMeta.value
            const returnTo = current?.return_to
            const actorRole = current?.by_role || 'admin'

            const res = await $fetch<any>('/api/users/impersonate/stop', { method: 'POST' })
            if (res.access_token) {
                await supabase.auth.setSession({ access_token: res.access_token, refresh_token: res.refresh_token })
            }

            await syncCurrentSessionProfile()
            authStore.skipOnboarding = true
            if (returnTo) {
                await navigateTo(returnTo)
            } else if (actorRole === 'superadmin') {
                await navigateTo('/super-admin/users-management')
            } else {
                await navigateTo(authStore.tenantSlug ? `/${authStore.tenantSlug}/users-management` : (getDashboardPath(authStore.role, authStore.tenantSlug) ?? '/onboarding/subscription'))
            }
        } catch (err: any) {
            console.error('Failed to exit impersonation:', err)
        }
    }

    return {
        isImpersonating,
        impersonationDepth,
        impersonatedName,
        impersonatedRole,
        loginAs,
        exitImpersonation,
    }
}
