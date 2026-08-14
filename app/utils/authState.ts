export type EnsuredAuthState = {
  user: any
  role: string | null
  permissions: string[]
  tenantId: string | null
  tenantSlug: string | null
  emailVerified: boolean
  subscriptionPlan?: string | null
  settings?: { logo_url?: string | null } | null
}

const AUTH_TIMEOUT_MS = 8000

function withTimeout<T>(promise: Promise<T>, label: string, timeoutMs = AUTH_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`${label} timed out`))
    }, timeoutMs)

    promise
      .then((value) => {
        clearTimeout(timeout)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timeout)
        reject(error)
      })
  })
}

export async function ensureAuthState(force = false): Promise<EnsuredAuthState | null> {
  const authStore = useAuthStore()
  const profileStore = useProfileStore()
  const supabase = useSupabase()

  if (!supabase) {
    authStore.clearUser()
    profileStore.clearProfile()
    return null
  }

  if (!force && authStore.isAuthenticated && authStore.role && authStore.permissions.length > 0) {
    const emailVerified = profileStore.data
      ? (profileStore.data.profile?.email_verified ?? false)
      : (authStore.settings !== null)

    return {
      user: authStore.user,
      role: authStore.role,
      permissions: authStore.permissions,
      tenantId: authStore.tenantId,
      tenantSlug: authStore.tenantSlug,
      emailVerified,
      subscriptionPlan: authStore.subscriptionPlan,
      settings: authStore.settings,
    }
  }

  try {
    const { data: { user } } = await withTimeout(supabase.auth.getUser(), 'auth.getUser')

    if (!user) {
      authStore.clearUser()
      profileStore.clearProfile()
      return null
    }

    const currentProfile = await withTimeout(profileStore.fetchProfile(force), 'profile bootstrap')

    if (!currentProfile?.user) {
      authStore.clearUser()
      profileStore.clearProfile()
      return null
    }

    const primaryRole = currentProfile.roles?.[0] as any
    const role = primaryRole?.name ?? null
    const permissions: string[] = primaryRole?.role_permissions
      ?.map((rp: any) => rp.permissions?.name)
      .filter(Boolean) ?? []
    const tenantId = currentProfile.tenant?.id ?? currentProfile.profile?.tenant_id ?? null
    const tenantSlug = currentProfile.tenant?.slug ?? null
    const emailVerified = currentProfile.profile?.email_verified ?? false

    authStore.setUser({
      user: currentProfile.user,
      role,
      permissions,
      tenantId: tenantId ?? authStore.tenantId,
      tenantSlug: tenantSlug ?? authStore.tenantSlug,
      subscriptionPlan: currentProfile.subscription?.plan ?? 'starter',
      subscriptionStatus: currentProfile.subscription?.status ?? null,
      settings: currentProfile.settings ?? null,
    })

    return {
      user: currentProfile.user,
      role,
      permissions,
      tenantId,
      tenantSlug,
      emailVerified,
      subscriptionPlan: currentProfile.subscription?.plan ?? null,
      settings: currentProfile.settings ?? null,
    }
  } catch {
    authStore.clearUser()
    profileStore.clearProfile()
    return null
  }
}
