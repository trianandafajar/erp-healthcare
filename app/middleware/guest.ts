export default defineNuxtRouteMiddleware(async (to) => {
    if (import.meta.server) return

    const { getUser } = useAuth()
    const user = await getUser()

    if (user && to.path !== '/reset-password') {
        return navigateTo('/')
    }
})