export function usePermission() {
    const authStore = useAuthStore()

    const can = (permission: string): boolean => {
        return authStore.hasPermission(permission)
    }

    const canAny = (permissions: string[]): boolean => {
        return authStore.hasAnyPermission(permissions)
    }

    const canAll = (permissions: string[]): boolean => {
        return permissions.every(p => authStore.hasPermission(p))
    }

    return { can, canAny, canAll }
}