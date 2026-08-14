import { describe, it, expect } from 'vitest'
import { DASHBOARD_BY_ROLE, getDashboardPath } from '../roleRedirect'

describe('getDashboardPath', () => {
    it('returns dashboard path for every known role', () => {
        expect(getDashboardPath('admin', 'clinic')).toBe('/clinic/dashboard')
        expect(getDashboardPath('doctor', 'clinic')).toBe('/clinic/doctor/dashboard')
        expect(getDashboardPath('specialist', 'clinic')).toBe('/clinic/doctor/dashboard')
        expect(getDashboardPath('nurse', 'clinic')).toBe('/clinic/nurse/dashboard')
        expect(getDashboardPath('pharmacy', 'clinic')).toBe('/clinic/pharmacy/dashboard')
        expect(getDashboardPath('receptionist', 'clinic')).toBe('/clinic/receptionist/dashboard')
        expect(getDashboardPath('patient', 'clinic')).toBe('/clinic/patient/dashboard')
    })

    it('returns null for unknown roles', () => {
        expect(getDashboardPath('hacker', 'clinic')).toBeNull()
        expect(getDashboardPath(undefined, 'clinic')).toBeNull()
        expect(getDashboardPath(null, 'clinic')).toBeNull()
    })

    it('returns plain path for superadmin without tenant slug', () => {
        expect(getDashboardPath('superadmin', null)).toBe('/super-admin/dashboard')
        expect(getDashboardPath('superadmin', 'clinic')).toBe('/super-admin/dashboard')
    })

    it('requires a tenant slug for non-superadmin roles', () => {
        expect(getDashboardPath('admin', null)).toBeNull()
        expect(getDashboardPath('admin', '')).toBeNull()
    })

    it('exposes DASHBOARD_BY_ROLE mapping', () => {
        expect(DASHBOARD_BY_ROLE.specialist).toBe('/doctor/dashboard')
    })
})
