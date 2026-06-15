export default defineNuxtRouteMiddleware(async (to) => {
    const { getUser } = useAuth()
    const user = await getUser()

    if (user && to.path !== '/reset-password') {
        return navigateTo('/dashboard')
    }
})
