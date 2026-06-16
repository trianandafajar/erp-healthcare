export default defineNuxtRouteMiddleware(async () => {
    const supabase = useSupabase()

    if (!supabase) {
        return navigateTo('/login')
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return navigateTo('/login')
    }
})
