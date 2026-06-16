export default defineNuxtRouteMiddleware(async (to) => {
    const supabase = useSupabase()

    if (!supabase) return navigateTo('/login')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return navigateTo('/login')

    const { data } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)
        .returns<any[]>()

    const role = (data as any)?.[0]?.roles?.name
    const requiredRoles = to.meta.role
        ? [to.meta.role]
        : Array.isArray(to.meta.roles)
            ? to.meta.roles
            : null

    if (requiredRoles && requiredRoles.includes(role)) {
        return
    }

    const redirectMap: Record<string, string> = {
        admin: '/dashboard',
        doctor: '/doctor/dashboard',
        specialist: '/doctor/dashboard',
        pharmacy: '/pharmacy/dashboard',
        nurse: '/nurse/dashboard',
        patient: '/patient/dashboard',
    }

    return navigateTo(redirectMap[role] ?? '/dashboard')
})
