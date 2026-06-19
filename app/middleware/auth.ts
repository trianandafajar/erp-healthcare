export default defineNuxtRouteMiddleware(async () => {
    const authStore = useAuthStore()
    if (authStore.isAuthenticated) return

    const supabase = useSupabase()

    if (!supabase) {
        return navigateTo('/login')
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return navigateTo('/login')
    }
})
