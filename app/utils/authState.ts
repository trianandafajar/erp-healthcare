type EnsuredAuthState = {
  user: any
  role: string | null
  permissions: string[]
  tenantId: string | null
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
    return {
      user: authStore.user,
      role: authStore.role,
      permissions: authStore.permissions,
      tenantId: authStore.tenantId,
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

    authStore.setUser({
      user: currentProfile.user,
      role,
      permissions,
      tenantId,
    })

    return {
      user: currentProfile.user,
      role,
      permissions,
      tenantId,
    }
  } catch {
    authStore.clearUser()
    profileStore.clearProfile()
    return null
  }
}
