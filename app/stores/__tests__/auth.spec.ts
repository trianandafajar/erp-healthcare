import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'

const KEY = 'auth'

function makeUser() {
    return {
        user: { id: 'u1', email: 'a@b.co' },
        role: 'doctor',
        permissions: ['appointment.view', 'appointment.create'],
        tenantId: 't1',
        tenantSlug: 'clinic',
        subscriptionPlan: 'pro',
        subscriptionStatus: 'active',
        settings: { logo_url: 'https://x/logo.png' },
    }
}

describe('useAuthStore', () => {
    beforeEach(() => {
        localStorage.clear()
        setActivePinia(createPinia())
    })

    it('starts unauthenticated', () => {
        const store = useAuthStore()
        expect(store.isAuthenticated).toBe(false)
        expect(store.role).toBeNull()
        expect(store.permissions).toEqual([])
    })

    it('setUser populates state and persists to localStorage', () => {
        const store = useAuthStore()
        store.setUser(makeUser())

        expect(store.user).toEqual({ id: 'u1', email: 'a@b.co' })
        expect(store.role).toBe('doctor')
        expect(store.permissions).toHaveLength(2)
        expect(store.tenantId).toBe('t1')
        expect(store.isAuthenticated).toBe(true)

        const saved = JSON.parse(localStorage.getItem(KEY)!)
        expect(saved.role).toBe('doctor')
        expect(saved.subscriptionPlan).toBe('pro')
    })

    it('setUser applies defaults for missing fields', () => {
        const store = useAuthStore()
        store.setUser({ user: { id: 'u1' }, role: 'patient', permissions: [] })
        expect(store.tenantId).toBeNull()
        expect(store.subscriptionPlan).toBe('starter')
        expect(store.subscriptionStatus).toBeNull()
        expect(store.settings).toBeNull()
    })

    it('hasPermission and hasAnyPermission', () => {
        const store = useAuthStore()
        store.setUser({ user: { id: 'u1' }, role: 'admin', permissions: ['a', 'b'] })

        expect(store.hasPermission('a')).toBe(true)
        expect(store.hasPermission('z')).toBe(false)
        expect(store.hasAnyPermission(['z', 'b'])).toBe(true)
        expect(store.hasAnyPermission(['x', 'y'])).toBe(false)
    })

    it('clearUser resets state and removes storage', () => {
        const store = useAuthStore()
        store.setUser(makeUser())
        store.clearUser()

        expect(store.isAuthenticated).toBe(false)
        expect(store.role).toBeNull()
        expect(store.permissions).toEqual([])
        expect(store.settings).toBeNull()
        expect(localStorage.getItem(KEY)).toBeNull()
    })

    it('hydrate restores persisted state', () => {
        localStorage.setItem(KEY, JSON.stringify(makeUser()))
        const store = useAuthStore()
        expect(store.role).toBe('doctor')
        expect(store.tenantSlug).toBe('clinic')
        expect(store.isAuthenticated).toBe(true)
    })

    it('hydrate ignores corrupt data', () => {
        localStorage.setItem(KEY, '{{not json')
        const store = useAuthStore()
        expect(store.isAuthenticated).toBe(false)
        expect(vi.fn()).not.toHaveBeenCalled()
    })
})
