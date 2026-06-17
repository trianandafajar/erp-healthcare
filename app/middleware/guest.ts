export default defineNuxtRouteMiddleware(async (to) => {
    const { getUser } = useAuth()
    const user = await getUser()

    if (!user || to.path === '/reset-password') return

    const supabase = useSupabase()
    if (!supabase) return navigateTo('/dashboard')

    const { data } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)
        .returns<any[]>()

    const role = (data as any)?.[0]?.roles?.name
    const redirectMap: Record<string, string> = {
        admin: '/dashboard',
        doctor: '/doctor/dashboard',
        specialist: '/doctor/dashboard',
        pharmacy: '/pharmacy/dashboard',
        nurse: '/nurse/dashboard',
        receptionist: '/receptionist/dashboard',
        patient: '/patient/dashboard',
    }

    return navigateTo(redirectMap[role] ?? '/dashboard')
})
