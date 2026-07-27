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
    const impersonationStack = useCookie<any[]>('impersonation_meta_stack', { default: () => [] })
    const isImpersonating = (impersonationStack.value?.length ?? 0) > 0

    if (role !== 'superadmin' && !isImpersonating) {
        if (!authState.emailVerified && !to.path.startsWith('/verify')) {
            return navigateTo(`/verify?email=${encodeURIComponent(authState.user?.email ?? '')}`, { replace: true })
        }

        if (!authStore.skipOnboarding) {
            const onboardingPath = getOnboardingPath(
              authStore.tenantId,
              authState.subscriptionPlan ?? authStore.subscriptionPlan,
              authState.settings ?? null,
              authStore.tenantSlug,
              role
            )

            if (onboardingPath && !to.path.startsWith('/onboarding/') && !to.path.includes('/configure')) {
                authStore.skipOnboarding = false
                return navigateTo(onboardingPath, { replace: true })
            }
        }
    }
    authStore.skipOnboarding = false

    if (!allowedRoles) return

    if (role && allowedRoles.includes(role)) return

    return navigateTo(getDashboardPath(role, authStore.tenantSlug), { replace: true })
})
