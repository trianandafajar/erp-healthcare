export default defineNuxtRouteMiddleware(() => {
    const token = useCookie('sb-token')

    if (!token.value) {
        return navigateTo('/login')
    }
})