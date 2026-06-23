export const useBilling = () => {
    const { data, refresh } = useFetch<any[]>('/api/billing', {
        default: () => [],
    })

    const billing = computed(() => data.value ?? [])

    async function updateBillingStatus(id: string, status: string) {
        await $fetch(`/api/billing/${id}/status`, {
            method: 'PATCH',
            body: { status },
        })
        await refresh()
    }

    return { billing, updateBillingStatus }
}