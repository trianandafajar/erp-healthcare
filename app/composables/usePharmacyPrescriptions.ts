import type { PrescriptionItem, PrescriptionStatus } from '~/data/pharmacy'

type PharmacyPrescriptionFeedItem = PrescriptionItem & {
    medicalRecordId: string
    lastUpdatedAt: string
}

type PharmacyPrescriptionGroup = {
    medicalRecordId: string
    patientName: string
    mrn: string
    doctorName: string
    status: PrescriptionStatus
    priority: PrescriptionItem['priority']
    requestedAt: string
    verifiedAt?: string | null
    dispensedAt?: string | null
    pharmacistNote?: string | null
    rejectionNote?: string | null
    lastUpdatedAt: string
    items: PharmacyPrescriptionFeedItem[]
}

type PrescriptionMutationPayload = {
    status: PrescriptionStatus
    pharmacistNote?: string | null
    rejectionNote?: string | null
}

const normalizePriority = (status: PrescriptionStatus): PrescriptionItem['priority'] => {
    if (status === 'Pending') return 'High'
    if (status === 'Verified') return 'Medium'
    return 'Low'
}

const groupPrescriptionsByMedicalRecord = (items: PharmacyPrescriptionFeedItem[]) => {
    const groups = new Map<string, PharmacyPrescriptionGroup>()

    items.forEach((item) => {
        const groupKey = item.medicalRecordId?.trim() || item.id
        const existing = groups.get(groupKey)

        if (!existing) {
            groups.set(groupKey, {
                medicalRecordId: groupKey,
                patientName: item.patientName,
                mrn: item.mrn,
                doctorName: item.doctorName,
                status: item.status,
                priority: item.priority,
                requestedAt: item.requestedAt,
                verifiedAt: item.verifiedAt ?? null,
                dispensedAt: item.dispensedAt ?? null,
                pharmacistNote: item.pharmacistNote ?? null,
                rejectionNote: item.rejectionNote ?? null,
                lastUpdatedAt: item.lastUpdatedAt,
                items: [item],
            })
            return
        }

        existing.items.push(item)

        if (new Date(item.requestedAt).getTime() < new Date(existing.requestedAt).getTime()) {
            existing.requestedAt = item.requestedAt
        }

        if (new Date(item.lastUpdatedAt).getTime() > new Date(existing.lastUpdatedAt).getTime()) {
            existing.lastUpdatedAt = item.lastUpdatedAt
        }

        if (!existing.pharmacistNote && item.pharmacistNote) {
            existing.pharmacistNote = item.pharmacistNote
        }

        if (!existing.rejectionNote && item.rejectionNote) {
            existing.rejectionNote = item.rejectionNote
        }
    })

    return Array.from(groups.values())
}

export const usePharmacyPrescriptions = () => {
    const { data, pending, error, refresh } = useFetch<PharmacyPrescriptionFeedItem[]>('/api/pharmacy/prescriptions', {
        key: 'pharmacy-prescriptions-feed',
        default: () => [],
    })

    const realtimeStatus = ref<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting')
    let realtimeChannel: any = null
    let refreshTimer: ReturnType<typeof setTimeout> | null = null

    const prescriptions = computed(() => data.value ?? [])

    function scheduleRefresh() {
        if (refreshTimer) {
            clearTimeout(refreshTimer)
        }

        refreshTimer = setTimeout(async () => {
            await refresh()
            refreshTimer = null
        }, 200)
    }

    async function setPrescriptionStatus(id: string, payload: PrescriptionMutationPayload) {
        await $fetch(`/api/pharmacy/prescriptions/${id}`, {
            method: 'PUT',
            body: payload,
        })

        await refresh()
    }

    function subscribeRealtime() {
        const supabase = useSupabase()

        if (!supabase) {
            realtimeStatus.value = 'error'
            return
        }

        if (realtimeChannel) {
            supabase.removeChannel(realtimeChannel)
        }

        realtimeChannel = supabase.channel('pharmacy-prescriptions-live')

        ;['INSERT', 'UPDATE', 'DELETE'].forEach((event) => {
            realtimeChannel?.on(
                'postgres_changes',
                {
                    event,
                    schema: 'public',
                    table: 'prescriptions',
                },
                (payload) => {
                    console.debug('[pharmacy-prescriptions realtime]', event, payload)
                    scheduleRefresh()
                },
            )
        })

        realtimeChannel?.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                realtimeStatus.value = 'connected'
                return
            }

            if (status === 'CHANNEL_ERROR') {
                realtimeStatus.value = 'error'
                return
            }

            if (status === 'TIMED_OUT') {
                realtimeStatus.value = 'disconnected'
                return
            }

            realtimeStatus.value = 'connecting'
        })
    }

    onMounted(() => {
        subscribeRealtime()
    })

    onBeforeUnmount(() => {
        if (refreshTimer) {
            clearTimeout(refreshTimer)
            refreshTimer = null
        }

        const supabase = useSupabase()

        if (supabase && realtimeChannel) {
            supabase.removeChannel(realtimeChannel)
            realtimeChannel = null
        }
    })

    return {
        prescriptions,
        groupedPrescriptions: computed(() => groupPrescriptionsByMedicalRecord(prescriptions.value)),
        pending,
        error,
        realtimeStatus,
        refresh,
        refreshPrescriptions: refresh,
        setPrescriptionStatus,
        normalizePriority,
        groupPrescriptionsByMedicalRecord,
    }
}

export type { PharmacyPrescriptionFeedItem, PharmacyPrescriptionGroup, PrescriptionMutationPayload }
