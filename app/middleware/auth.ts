export default defineNuxtRouteMiddleware(async () => {
    const supabase = useSupabase()

    if (!supabase) {
        return navigateTo('/login')
    }

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        return navigateTo('/login')
    }
})
