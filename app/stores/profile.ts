type CurrentProfileResponse = {
    user: {
        id: string
        email?: string
    }
    profile: any
    roles: {
        id: string
        name?: string
        label: string
        role_permissions?: {
            permissions?: {
                name?: string
            } | null
        }[]
    }[]
    tenant?: {
        id: string
        name: string
        slug: string
        subscription_plan: string
        subscription_status: string
    } | null
}

export const useProfileStore = defineStore('profile', () => {
    const data = ref<CurrentProfileResponse | null>(null)
    const pending = ref(false)
    const loaded = ref(false)
    const error = ref<any>(null)
    let inFlight: Promise<CurrentProfileResponse | null> | null = null

    async function fetchProfile(force = false) {
        if (loaded.value && !force) return data.value
        if (inFlight) return inFlight

        pending.value = true
        inFlight = $fetch<CurrentProfileResponse>('/api/profile', {
            timeout: 8000,
            retry: 0,
        })
            .then((response) => {
                data.value = response
                loaded.value = true
                error.value = null
                return response
            })
            .catch((err) => {
                error.value = err
                if (err?.statusCode === 401 || err?.status === 401) {
                    data.value = null
                    loaded.value = false
                }
                throw err
            })
            .finally(() => {
                pending.value = false
                inFlight = null
            }) as Promise<CurrentProfileResponse | null>

        return inFlight
    }

    function refreshProfile() {
        return fetchProfile(true)
    }

    function clearProfile() {
        data.value = null
        pending.value = false
        loaded.value = false
        error.value = null
        inFlight = null
    }

    const profile = computed(() => data.value?.profile ?? null)
    const roles = computed(() => data.value?.roles ?? [])
    const user = computed(() => data.value?.user ?? null)

    return {
        data,
        pending,
        loaded,
        error,
        profile,
        roles,
        user,
        fetchProfile,
        refreshProfile,
        clearProfile,
    }
})
