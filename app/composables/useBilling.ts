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

    async function createBilling(payload: {
        patientId: string
        medicalRecordId: string
        serviceName: string
        department: string
        amount: number
        paymentMethod: string
        serviceDate?: string
    }) {
        await $fetch('/api/billing', {
            method: 'POST',
            body: payload,
        })
        await refresh()
    }

    return { billing, updateBillingStatus, createBilling }
}