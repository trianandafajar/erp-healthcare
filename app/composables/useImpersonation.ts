export const useImpersonation = () => {
    const supabase = useSupabase()
    const authStore = useAuthStore()
    const profileStore = useProfileStore()

    const metaCookie = useCookie<any>('impersonation_meta', { default: () => null })

    const isImpersonating = computed(() => !!metaCookie.value)
    const impersonatedName = computed(() => metaCookie.value?.name ?? '')
    const impersonatedRole = computed(() => metaCookie.value?.role ?? '')

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
            await navigateTo(dashboard)
        } catch (err: any) {
            throw err
        }
    }

    async function exitImpersonation() {
        if (!supabase) return

        try {
            const returnTo = metaCookie.value?.return_to
            const actorRole = metaCookie.value?.by_role || 'admin'

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
                await navigateTo(authStore.tenantSlug ? `/${authStore.tenantSlug}/users-management` : '/dashboard')
            }
        } catch (err: any) {
            console.error('Failed to exit impersonation:', err)
        }
    }

    return {
        isImpersonating,
        impersonatedName,
        impersonatedRole,
        loginAs,
        exitImpersonation,
    }
}
