export default defineNuxtRouteMiddleware((to) => {
    const authStore = useAuthStore()

    if (!authStore.isAuthenticated) {
        return navigateTo('/login')
    }
    const required = to.meta.permissions as string[] | undefined
    if (!required || required.length === 0) return

    const hasAccess = required.every(p => authStore.hasPermission(p))
    if (!hasAccess) {
        return navigateTo('/403')
    }
})