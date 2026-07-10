export const useAuthStore = defineStore('auth', () => {
    const user = ref<any>(null)
    const role = ref<string | null>(null)
    const permissions = ref<string[]>([])
    const tenantId = ref<string | null>(null)
    const tenantSlug = ref<string | null>(null)
    const subscriptionPlan = ref<string>('starter')
    const subscriptionStatus = ref<string | null>(null)
    const settings = ref<{ logo_url?: string | null } | null>(null)

    function setUser(payload: {
        user: any
        role: string | null
        permissions: string[]
        tenantId?: string | null
        tenantSlug?: string | null
        subscriptionPlan?: string
        subscriptionStatus?: string | null
        settings?: { logo_url?: string | null } | null
    }) {
        user.value = payload.user
        role.value = payload.role
        permissions.value = payload.permissions
        tenantId.value = payload.tenantId ?? null
        tenantSlug.value = payload.tenantSlug ?? null
        subscriptionPlan.value = payload.subscriptionPlan ?? 'starter'
        subscriptionStatus.value = payload.subscriptionStatus ?? null
        if (payload.settings !== undefined) settings.value = payload.settings
    }

    function hasPermission(permission: string): boolean {
        return permissions.value.includes(permission)
    }

    function hasAnyPermission(perms: string[]): boolean {
        return perms.some(p => permissions.value.includes(p))
    }

    function clearUser() {
        user.value = null
        role.value = null
        permissions.value = []
        tenantId.value = null
        tenantSlug.value = null
        subscriptionPlan.value = 'starter'
        subscriptionStatus.value = null
        settings.value = null
    }

    const isAuthenticated = computed(() => !!user.value)

    return {
        user, role, permissions, tenantId, tenantSlug, subscriptionPlan, subscriptionStatus, settings, isAuthenticated,
        setUser, hasPermission, hasAnyPermission, clearUser
    }
})