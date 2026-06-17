<script setup lang="ts">
import NursePriorityPatients from './dashboard/NursePriorityPatients.vue'
import NurseLatestUpdates from './dashboard/NurseLatestUpdates.vue'

type NursePatient = {
    id: string
    full_name: string
    medical_record_number: string
}

type NurseVitalRecord = {
    id: string
    patient_id: string
    patient_name: string
    medical_record_number: string
    blood_pressure: string
    temperature: string | number | null
    pulse: string | number | null
    notes: string | null
    recorded_at: string
}

type NurseCareNote = {
    id: string
    patient_id: string
    patient_name: string
    medical_record_number: string
    category: string
    note: string
    author_name: string
    recorded_at: string
}

type NurseProcedure = {
    id: string
    patient_id: string
    patient_name: string
    medical_record_number: string
    procedure_name: string
    scheduled_at: string
    ended_at: string | null
    priority: 'Low' | 'Medium' | 'High'
    status: 'Planned' | 'In Progress' | 'Completed'
    notes: string
    recorded_by_name: string | null
}

type DashboardSummaryCard = {
    title: string
    value: string
    caption: string
    to: string
    color: string
}

type PatientOverviewItem = {
    id: string
    name: string
    mrn: string
    room: string
    status: 'Stable' | 'Watch' | 'Critical'
    lastUpdate: string
}

type UpdateItem = {
    kind: 'Vital' | 'Note' | 'Procedure'
    title: string
    detail: string
    time: string
}

const { data: patientData, pending: patientPending, refresh: refreshPatients } = useLazyFetch<{ patients: NursePatient[] }>('/api/nurse/patients')
const { data: vitalData, pending: vitalPending, refresh: refreshVitals } = useLazyFetch<{ vitals: NurseVitalRecord[] }>('/api/nurse/vitals')
const { data: noteData, pending: notePending, refresh: refreshNotes } = useLazyFetch<{ notes: NurseCareNote[] }>('/api/nurse/care-notes')
const { data: procedureData, pending: procedurePending, refresh: refreshProcedures } = useLazyFetch<{ procedures: NurseProcedure[] }>('/api/nurse/procedures')

const realtimeStatus = ref<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting')
let refreshTimer: ReturnType<typeof setTimeout> | null = null
let realtimeChannel: any = null

const latestVitals = computed(() => vitalData.value?.vitals ?? [])
const latestNotes = computed(() => noteData.value?.notes ?? [])
const latestProcedures = computed(() => procedureData.value?.procedures ?? [])

const patientCount = computed(() => patientData.value?.patients?.length ?? 0)
const vitalCount = computed(() => latestVitals.value.length)
const noteCount = computed(() => latestNotes.value.length)
const procedureCount = computed(() => latestProcedures.value.length)

const patientOverview = computed<PatientOverviewItem[]>(() => {
    const groups = new Map<string, NurseVitalRecord[]>()

    for (const vital of latestVitals.value) {
        const list = groups.get(vital.patient_id) ?? []
        list.push(vital)
        groups.set(vital.patient_id, list)
    }

    return Array.from(groups.entries())
        .map(([patientId, history]) => {
            const latestVital = history[0]
            const latestNote = latestNotes.value.find((item) => item.patient_id === patientId) ?? null
            const latestProcedure = latestProcedures.value.find((item) => item.patient_id === patientId) ?? null

            return {
                id: patientId,
                name: latestVital?.patient_name ?? '-',
                mrn: latestVital?.medical_record_number ?? '-',
                room: deriveRoom(latestVital),
                status: deriveStatus(latestVital),
                lastUpdate: latestTimestamp([latestVital?.recorded_at, latestNote?.recorded_at, latestProcedure?.scheduled_at]),
            }
        })
        .sort((left, right) => new Date(right.lastUpdate).getTime() - new Date(left.lastUpdate).getTime())
})

const statusSummary = computed(() => {
    return patientOverview.value.reduce(
        (accumulator, patient) => {
            accumulator[patient.status] += 1
            return accumulator
        },
        {
            Stable: 0,
            Watch: 0,
            Critical: 0,
        },
    )
})

const recentActivity = computed<UpdateItem[]>(() => {
    const vitals = latestVitals.value.slice(0, 3).map((item) => ({
        kind: 'Vital' as const,
        title: item.patient_name,
        detail: `${item.blood_pressure} • ${item.temperature ?? '-'} °C • HR ${item.pulse ?? '-'}`,
        time: item.recorded_at,
    }))

    const notes = latestNotes.value.slice(0, 3).map((item) => ({
        kind: 'Note' as const,
        title: item.patient_name,
        detail: item.note,
        time: item.recorded_at,
    }))

    const procedures = latestProcedures.value.slice(0, 3).map((item) => ({
        kind: 'Procedure' as const,
        title: item.patient_name,
        detail: `${item.procedure_name} • ${item.status}`,
        time: item.scheduled_at,
    }))

    return [...vitals, ...notes, ...procedures]
        .sort((left, right) => new Date(right.time).getTime() - new Date(left.time).getTime())
        .slice(0, 6)
})

const isLoading = computed(() => patientPending.value || vitalPending.value || notePending.value || procedurePending.value)

const summaryCards = computed<DashboardSummaryCard[]>(() => [
    {
        title: 'Patients',
        value: patientCount.value.toString(),
        caption: 'Active patients under care',
        to: '/nurse/patients',
        color: 'primary',
    },
    {
        title: 'Vital Signs',
        value: vitalCount.value.toString(),
        caption: 'Live vital sign records',
        to: '/nurse/vitals',
        color: 'error',
    },
    {
        title: 'Care Notes',
        value: noteCount.value.toString(),
        caption: 'Progress notes and observations',
        to: '/nurse/care-notes',
        color: 'secondary',
    },
    {
        title: 'Procedure Schedule',
        value: procedureCount.value.toString(),
        caption: 'Planned and ongoing procedures',
        to: '/nurse/procedures',
        color: 'info',
    },
    {
        title: 'Patient Monitoring',
        value: statusSummary.value.Critical.toString(),
        caption: `${statusSummary.value.Watch} need closer observation`,
        to: '/nurse/monitoring',
        color: 'warning',
    },
    {
        title: 'Stable Patients',
        value: statusSummary.value.Stable.toString(),
        caption: 'Patients currently stable',
        to: '/nurse/monitoring',
        color: 'success',
    },
    {
        title: 'Observation',
        value: statusSummary.value.Watch.toString(),
        caption: 'Patients needing close observation',
        to: '/nurse/monitoring',
        color: 'warning',
    },
    {
        title: 'Critical',
        value: statusSummary.value.Critical.toString(),
        caption: 'Patients needing immediate attention',
        to: '/nurse/monitoring',
        color: 'error',
    },
])

const summaryPendingMap = computed<Record<string, boolean>>(() => ({
    Patients: patientPending.value,
    'Vital Signs': vitalPending.value,
    'Care Notes': notePending.value,
    'Procedure Schedule': procedurePending.value,
    'Patient Monitoring': vitalPending.value || notePending.value || procedurePending.value,
    'Stable Patients': vitalPending.value,
    Observation: vitalPending.value,
    Critical: vitalPending.value,
}))

onMounted(() => {
    refreshAll()
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

function refreshAll() {
    refreshPatients()
    refreshVitals()
    refreshNotes()
    refreshProcedures()
}

function scheduleRefresh() {
    if (refreshTimer) {
        clearTimeout(refreshTimer)
    }

    refreshTimer = setTimeout(() => {
        refreshAll()
        refreshTimer = null
    }, 200)
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

    realtimeChannel = supabase.channel('nurse-dashboard-live')

    ;['patients', 'nurse_vital_signs', 'nurse_care_notes', 'nurse_procedures'].forEach((table) => {
        ;['INSERT', 'UPDATE', 'DELETE'].forEach((event) => {
            realtimeChannel?.on(
                'postgres_changes',
                {
                    event,
                    schema: 'public',
                    table,
                },
                scheduleRefresh,
            )
        })
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

function latestTimestamp(values: Array<string | null | undefined>) {
    return values
        .filter(Boolean)
        .sort((left, right) => new Date(right as string).getTime() - new Date(left as string).getTime())[0] as string
}

function parseBloodPressure(value: string) {
    const [systolicRaw, diastolicRaw] = value.split('/').map((part) => Number(part))

    if (!Number.isFinite(systolicRaw) || !Number.isFinite(diastolicRaw)) {
        return null
    }

    return {
        systolic: systolicRaw,
        diastolic: diastolicRaw,
    }
}

function deriveStatus(vital?: NurseVitalRecord) {
    if (!vital) return 'Stable'

    const pulse = Number(vital.pulse ?? 0)
    const temperature = Number(vital.temperature ?? 0)
    const pressure = parseBloodPressure(vital.blood_pressure)
    const systolic = pressure?.systolic ?? 0

    if (pulse > 120 || pulse < 50 || temperature >= 39 || systolic < 90) return 'Critical'
    if (pulse >= 101 || temperature >= 37.5 || systolic < 110) return 'Watch'
    return 'Stable'
}

function deriveRoom(vital?: NurseVitalRecord) {
    const status = deriveStatus(vital)

    if (status === 'Critical') return 'ICU'
    if (status === 'Watch') return 'Observation'
    return 'Ward'
}
</script>

<template>
    <NurseDashboardHero />
    <NurseDashboardSummaryCards :cards="summaryCards" :pending-map="summaryPendingMap" />

    <NurseDashboardChart :vitals="latestVitals" :loading="isLoading" />

    <v-row class="mt-4">
        <v-col cols="12" lg="7">
            <nurse-priority-patients :patients="patientOverview" :loading="isLoading" />
        </v-col>

        <v-col cols="12" lg="5">
            <NurseLatestUpdates :items="recentActivity" :loading="isLoading" />
        </v-col>
    </v-row>

</template>
