export function getOnboardingPath(
  tenantId?: string | null,
  subscriptionPlan?: string | null,
  settings?: { logo_url?: string | null } | null,
  tenantSlug?: string | null,
  role?: string | null
): string | null {
  if (!tenantId) {
    return '/onboarding/subscription'
  }
  if (role === 'admin' && !settings?.logo_url && tenantSlug) {
    return `/${tenantSlug}/configure`
  }
  return null
}
