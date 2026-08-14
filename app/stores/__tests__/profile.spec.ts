import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProfileStore } from '../profile'

const KEY = 'profile'

function makeProfile() {
    return {
        user: { id: 'u1', email: 'a@b.co' },
        profile: { id: 'u1', email_verified: true },
        roles: [{ id: 'r1', name: 'doctor', label: 'Doctor', role_permissions: [] }],
        tenant: { id: 't1', name: 'Clinic', slug: 'clinic', subscription_plan: 'pro', subscription_status: 'active' },
        subscription: { plan: 'pro', status: 'active', billing_cycle: 'monthly', amount: 10, currency: 'usd', next_billing: null, trial_ends: null, start_date: null, stripe_customer_id: null },
        settings: null,
    }
}

describe('useProfileStore', () => {
    beforeEach(() => {
        localStorage.clear()
        setActivePinia(createPinia())
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('starts empty', () => {
        const store = useProfileStore()
        expect(store.data).toBeNull()
        expect(store.loaded).toBe(false)
        expect(store.pending).toBe(false)
    })

    it('fetchProfile loads data from /api/profile and persists', async () => {
        const payload = makeProfile()
        vi.stubGlobal('$fetch', vi.fn().mockResolvedValue(payload))

        const store = useProfileStore()
        const result = await store.fetchProfile()

        expect($fetch).toHaveBeenCalledWith('/api/profile', expect.objectContaining({ timeout: 8000 }))
        expect(result).toEqual(payload)
        expect(store.loaded).toBe(true)
        expect(store.profile?.email_verified).toBe(true)
        expect(store.roles).toHaveLength(1)
        expect(store.tenant?.slug).toBe('clinic')
        expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(payload)
    })

    it('does not refetch when already loaded without force', async () => {
        const payload = makeProfile()
        vi.stubGlobal('$fetch', vi.fn().mockResolvedValue(payload))

        const store = useProfileStore()
        await store.fetchProfile()
        const fetchMock = vi.mocked($fetch)
        fetchMock.mockClear()

        const again = await store.fetchProfile()
        expect(again).toEqual(payload)
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('refetches when forced', async () => {
        vi.stubGlobal('$fetch', vi.fn().mockResolvedValue(makeProfile()))
        const store = useProfileStore()
        await store.fetchProfile()

        vi.mocked($fetch).mockClear()
        await store.refreshProfile()
        expect($fetch).toHaveBeenCalledTimes(1)
    })

    it('clears data on 401 and rethrows', async () => {
        vi.stubGlobal('$fetch', vi.fn().mockRejectedValue({ statusCode: 401 }))
        const store = useProfileStore()
        await expect(store.fetchProfile()).rejects.toBeTruthy()
        expect(store.data).toBeNull()
        expect(store.loaded).toBe(false)
    })

    it('clearProfile resets everything', async () => {
        vi.stubGlobal('$fetch', vi.fn().mockResolvedValue(makeProfile()))
        const store = useProfileStore()
        await store.fetchProfile()
        store.clearProfile()

        expect(store.data).toBeNull()
        expect(store.loaded).toBe(false)
        expect(localStorage.getItem(KEY)).toBeNull()
    })
})
