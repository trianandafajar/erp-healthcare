export default defineNuxtPlugin(async () => {
    if (import.meta.server) return

    const authStore = useAuthStore()
    if (authStore.isAuthenticated) return

    const profileStore = useProfileStore()
    const currentProfile = await profileStore.fetchProfile().catch(() => null)
    if (!currentProfile?.user) return

    const primaryRole = currentProfile.roles?.[0] as any
    const role = primaryRole?.name ?? null

    const permissions: string[] = primaryRole?.role_permissions
        ?.map((rp: any) => rp.permissions?.name)
        .filter(Boolean) ?? []

    authStore.setUser({
        user: currentProfile.user,
        role,
        permissions,
    })
})
