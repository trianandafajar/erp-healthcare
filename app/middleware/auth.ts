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
    const allowedRoles = getAllowedRolesForPath(to.path)
    const authState = await ensureAuthState()
    if (!authState?.user) {
        if (import.meta.server) return
        return navigateTo('/login', { replace: true })
    }

    if (!allowedRoles) return
    const role = authState.role ?? null

    if (role && allowedRoles.includes(role)) return

    return navigateTo(getDashboardPath(role), { replace: true })
})
