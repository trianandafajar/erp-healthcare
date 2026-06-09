export default defineNuxtRouteMiddleware(async () => {
    if (import.meta.server) return

    const { getUser } = useAuth()
    const user = await getUser()

    if (user) {
        return navigateTo('/')
    }
})