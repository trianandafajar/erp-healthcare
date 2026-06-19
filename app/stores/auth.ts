export const useAuthStore = defineStore('auth', () => {
    const user = ref<any>(null)
    const role = ref<string | null>(null)
    const permissions = ref<string[]>([])

    function setUser(payload: {
        user: any
        role: string | null
        permissions: string[]
    }) {
        user.value = payload.user
        role.value = payload.role
        permissions.value = payload.permissions
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
    }

    const isAuthenticated = computed(() => !!user.value)

    return {
        user, role, permissions, isAuthenticated,
        setUser, hasPermission, hasAnyPermission, clearUser
    }
})
