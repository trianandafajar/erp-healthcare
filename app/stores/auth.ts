export const useAuthStore = defineStore('auth', () => {
    const user = ref<any>(null)
    const role = ref<string | null>(null)
    const permissions = ref<string[]>([])
    const tenantId = ref<string | null>(null)
    const tenantSlug = ref<string | null>(null)
    const subscriptionPlan = ref<string>('starter')
    const subscriptionStatus = ref<string | null>(null)
    const settings = ref<{ logo_url?: string | null } | null>(null)

    function hydrate() {
        if (!import.meta.client) return
        try {
            const raw = localStorage.getItem('auth')
            if (!raw) return
            const saved = JSON.parse(raw)
            user.value = saved.user ?? null
            role.value = saved.role ?? null
            permissions.value = saved.permissions ?? []
            tenantId.value = saved.tenantId ?? null
            tenantSlug.value = saved.tenantSlug ?? null
            subscriptionPlan.value = saved.subscriptionPlan ?? 'starter'
            subscriptionStatus.value = saved.subscriptionStatus ?? null
            settings.value = saved.settings ?? null
        } catch {}
    }

    function persist() {
        if (!import.meta.client) return
        localStorage.setItem('auth', JSON.stringify({
            user: user.value,
            role: role.value,
            permissions: permissions.value,
            tenantId: tenantId.value,
            tenantSlug: tenantSlug.value,
            subscriptionPlan: subscriptionPlan.value,
            subscriptionStatus: subscriptionStatus.value,
            settings: settings.value,
        }))
    }

    hydrate()

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
        persist()
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
        if (import.meta.client) {
            localStorage.removeItem('auth')
        }
    }

    const isAuthenticated = computed(() => !!user.value)

    return {
        user, role, permissions, tenantId, tenantSlug, subscriptionPlan, subscriptionStatus, settings, isAuthenticated,
        setUser, hasPermission, hasAnyPermission, clearUser
    }
})
