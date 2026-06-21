import { getDashboardPath } from '~/utils/roleRedirect'

function getAllowedRolesForPath(path: string): string[] | null {
    if (path === '/login' || path === '/403') return null

    if (path.startsWith('/dashboard') || path.startsWith('/(admin)')) {
        return ['admin']
    }

    if (path.startsWith('/doctor/')) return ['doctor', 'specialist']
    if (path.startsWith('/nurse/')) return ['nurse']
    if (path.startsWith('/pharmacy/')) return ['pharmacy']
    if (path.startsWith('/receptionist/')) return ['receptionist']
    if (path.startsWith('/patient/')) return ['patient']
    return null
}

export default defineNuxtRouteMiddleware(async (to) => {
    const authStore = useAuthStore()
    const supabase = useSupabase()
    if (!supabase) return navigateTo('/login')

    const allowedRoles = getAllowedRolesForPath(to.path)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return navigateTo('/login')

    if (!allowedRoles) return

    const { data } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)
        .returns<any[]>()

    const role = (data as any)?.[0]?.roles?.name as string | undefined

    if (role && allowedRoles.includes(role)) return

    return navigateTo(getDashboardPath(role ?? authStore.role ?? null))
})
