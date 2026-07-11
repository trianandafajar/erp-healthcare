import { getDashboardPath } from '~/utils/roleRedirect'
import { useAuthStore } from '~/stores/auth'

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
    if (path.startsWith('/super-admin/')) return ['superadmin']
    return null
}

export default defineNuxtRouteMiddleware(async (to) => {
    const allowedRoles = getAllowedRolesForPath(to.path)
    const authState = await ensureAuthState()
    if (!authState?.user) {
        if (import.meta.server) return
        return navigateTo('/login', { replace: true })
    }

    const authStore = useAuthStore()
    const role = authState.role ?? null

    if (role !== 'superadmin') {
        const onboardingPath = getOnboardingPath(
          authStore.tenantId,
          authState.subscriptionPlan ?? authStore.subscriptionPlan,
          authState.settings ?? null,
          authStore.tenantSlug
        )

        if (onboardingPath && !to.path.startsWith('/onboarding/') && !to.path.includes('/configure')) {
            return navigateTo(onboardingPath, { replace: true })
        }
    }

    if (!allowedRoles) return

    if (role && allowedRoles.includes(role)) return

    return navigateTo(getDashboardPath(role, authStore.tenantSlug), { replace: true })
})
