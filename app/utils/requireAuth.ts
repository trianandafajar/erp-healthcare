import type { EnsuredAuthState } from '~/utils/authState'

export type RequireAuthResult =
  | { ok: true; state: EnsuredAuthState }
  | { ok: false; redirect: string }

export async function requireAuth(currentPath: string): Promise<RequireAuthResult | null> {
    const authState = await ensureAuthState()
    if (!authState?.user) {
        if (import.meta.server) return null
        return { ok: false, redirect: '/login' }
    }

    const authStore = useAuthStore()
    const role = authState.role ?? null
    const impersonationStack = useCookie<any[]>('impersonation_meta_stack', { default: () => [] })
    const isImpersonating = (impersonationStack.value?.length ?? 0) > 0

    if (role !== 'superadmin' && !isImpersonating) {
        if (!authState.emailVerified && !currentPath.startsWith('/verify')) {
            return { ok: false, redirect: `/verify?email=${encodeURIComponent(authState.user?.email ?? '')}` }
        }

        if (!authStore.skipOnboarding) {
            const onboardingPath = getOnboardingPath(
                authStore.tenantId,
                authState.subscriptionPlan ?? authStore.subscriptionPlan,
                authState.settings ?? null,
                authStore.tenantSlug,
                role
            )

            if (onboardingPath && !currentPath.startsWith('/onboarding/') && !currentPath.includes('/configure')) {
                authStore.skipOnboarding = false
                return { ok: false, redirect: onboardingPath }
            }
        }
    }
    authStore.skipOnboarding = false

    return { ok: true, state: authState }
}
