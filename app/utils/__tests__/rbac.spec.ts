import { describe, it, expect } from 'vitest'
import { ROLE_AREA_ROLES, getAllowedRolesForPath } from '../rbac'

describe('getAllowedRolesForPath', () => {
    it('returns roles for known area prefixes', () => {
        expect(getAllowedRolesForPath('/doctor/dashboard')).toEqual(['doctor', 'specialist'])
        expect(getAllowedRolesForPath('/nurse/workspace')).toEqual(['nurse'])
        expect(getAllowedRolesForPath('/pharmacy/medicines')).toEqual(['pharmacy'])
        expect(getAllowedRolesForPath('/receptionist/appointments')).toEqual(['receptionist'])
        expect(getAllowedRolesForPath('/patient/dashboard')).toEqual(['patient'])
        expect(getAllowedRolesForPath('/super-admin/dashboard')).toEqual(['superadmin'])
    })

    it('matches prefixes at path start', () => {
        expect(getAllowedRolesForPath('/patient')).toEqual(['patient'])
        expect(getAllowedRolesForPath('/doctor')).toEqual(['doctor', 'specialist'])
    })

    it('matches via naive startsWith prefix', () => {
        expect(getAllowedRolesForPath('/doctorate')).toEqual(['doctor', 'specialist'])
    })

    it('returns null for unprotected paths', () => {
        expect(getAllowedRolesForPath('/login')).toBeNull()
        expect(getAllowedRolesForPath('/')).toBeNull()
        expect(getAllowedRolesForPath('/public-booking/abc')).toBeNull()
    })

    it('exposes a stable role-to-area mapping', () => {
        expect(ROLE_AREA_ROLES).toMatchObject({
            '/doctor': ['doctor', 'specialist'],
            '/nurse': ['nurse'],
            '/patient': ['patient'],
        })
    })
})
