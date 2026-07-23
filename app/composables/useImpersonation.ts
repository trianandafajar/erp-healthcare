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
            await $fetch('/api/users/impersonate/start', {
                method: 'POST',
                body: { id: user.id },
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
            await $fetch('/api/users/impersonate/stop', { method: 'POST' })

            await syncCurrentSessionProfile()
            const actorRole = metaCookie.value?.by_role || 'admin'
            await navigateTo(actorRole === 'superadmin' ? '/super-admin/users-management' : '/users-management')
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
