export const useAuthStore = defineStore('auth', () => {
    const user = ref<any>(null)
    const role = ref<string | null>(null)
    const permissions = ref<string[]>([])
    const tenantId = ref<string | null>(null)

    function setUser(payload: {
        user: any
        role: string | null
        permissions: string[]
        tenantId?: string | null
    }) {
        user.value = payload.user
        role.value = payload.role
        permissions.value = payload.permissions
        tenantId.value = payload.tenantId ?? null
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
    }

    const isAuthenticated = computed(() => !!user.value)

    return {
        user, role, permissions, tenantId, isAuthenticated,
        setUser, hasPermission, hasAnyPermission, clearUser
    }
})
