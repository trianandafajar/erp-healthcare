import { describe, it, expect } from 'vitest'
import { getOnboardingPath } from '../onboardingRedirect'

describe('getOnboardingPath', () => {
    it('forces subscription onboarding when no tenant id', () => {
        expect(getOnboardingPath(null, 'starter', null, null, 'admin')).toBe('/onboarding/subscription')
        expect(getOnboardingPath(undefined, undefined, undefined, undefined, undefined)).toBe('/onboarding/subscription')
    })

    it('forces configure step for admins without display name', () => {
        expect(getOnboardingPath('t1', 'starter', null, 'clinic', 'admin')).toBe('/clinic/configure')
        expect(getOnboardingPath('t1', 'starter', { logo_url: null }, 'clinic', 'admin')).toBe('/clinic/configure')
    })

    it('returns null when tenant exists and admin already configured', () => {
        expect(getOnboardingPath('t1', 'starter', { display_name: 'My Clinic' }, 'clinic', 'admin')).toBeNull()
    })

    it('returns null for non-admin roles with a tenant', () => {
        expect(getOnboardingPath('t1', 'starter', null, 'clinic', 'doctor')).toBeNull()
        expect(getOnboardingPath('t1', 'pro', { display_name: 'X' }, 'clinic', 'nurse')).toBeNull()
        expect(getOnboardingPath('t1', 'starter', null, 'clinic', 'patient')).toBeNull()
    })

    it('requires tenantSlug for the configure redirect', () => {
        expect(getOnboardingPath('t1', 'starter', null, null, 'admin')).toBeNull()
    })
})
