<script setup lang="ts">
type NursePatientOption = {
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
    weight: string | number | null
    height: string | number | null
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

const { pending: patientPending, refresh: refreshPatients } = useLazyFetch<{ patients: NursePatientOption[] }>('/api/nurse/patients')
const { data: vitalData, pending: vitalPending, refresh: refreshVitals } = useLazyFetch<{ vitals: NurseVitalRecord[] }>('/api/nurse/vitals')
const { data: noteData, pending: notePending, refresh: refreshNotes } = useLazyFetch<{ notes: NurseCareNote[] }>('/api/nurse/care-notes')
const { data: procedureData, pending: procedurePending, refresh: refreshProcedures } = useLazyFetch<{ procedures: NurseProcedure[] }>('/api/nurse/procedures')

const search = ref('')
const statusFilter = ref<'all' | 'Normal' | 'Need Observation' | 'Critical'>('all')
const roomFilter = ref<'all' | 'ICU' | 'Observation' | 'Ward'>('all')
const priorityFilter = ref<'all' | 'High' | 'Medium' | 'Low'>('all')
const detailDialog = ref(false)
const selectedPatientId = ref<string | null>(null)
const liveClock = ref(new Date())
const realtimeStatus = ref<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting')

const statusOptions = [
    { title: 'All status', value: 'all' },
    { title: 'Normal', value: 'Normal' },
    { title: 'Need Observation', value: 'Need Observation' },
    { title: 'Critical', value: 'Critical' },
]

const roomOptions = [
    { title: 'All rooms', value: 'all' },
    { title: 'ICU', value: 'ICU' },
    { title: 'Observation', value: 'Observation' },
    { title: 'Ward', value: 'Ward' },
]

const priorityOptions = [
    { title: 'All priority', value: 'all' },
    { title: 'High', value: 'High' },
    { title: 'Medium', value: 'Medium' },
    { title: 'Low', value: 'Low' },
]

const latestVitals = computed(() => vitalData.value?.vitals ?? [])
const latestNotes = computed(() => noteData.value?.notes ?? [])
const latestProcedures = computed(() => procedureData.value?.procedures ?? [])

const patientCards = computed(() => {
    const groups = new Map<string, NurseVitalRecord[]>()

    for (const vital of latestVitals.value) {
        const list = groups.get(vital.patient_id) ?? []
        list.push(vital)
        groups.set(vital.patient_id, list)
    }

    return latestVitals.value
        .filter((vital, index, array) => array.findIndex((item) => item.patient_id === vital.patient_id) === index)
        .map((latestVital) => {
            const history = groups.get(latestVital.patient_id) ?? []
            const relatedNotes = latestNotes.value.filter((note) => note.patient_id === latestVital.patient_id)
            const relatedProcedures = latestProcedures.value.filter((procedure) => procedure.patient_id === latestVital.patient_id)
            const latestNote = relatedNotes[0] ?? null
            const latestProcedure = relatedProcedures[0] ?? null
            const parsedPressure = parseBloodPressure(latestVital.blood_pressure)
            const status = deriveStatus(latestVital)
            const room = deriveRoom(status)
            const priority = derivePriority(latestVital, latestProcedure, latestNote)

            return {
                id: latestVital.patient_id,
                name: latestVital.patient_name,
                mrn: latestVital.medical_record_number,
                room,
                status,
                priority,
                history,
                latestVital,
                latestNote,
                latestProcedure,
                metrics: {
                    heartRate: latestVital.pulse != null ? Number(latestVital.pulse) : null,
                    bloodPressure: latestVital.blood_pressure,
                    bloodPressureParsed: parsedPressure,
                    temperature: latestVital.temperature != null ? Number(latestVital.temperature) : null,
                    spo2: estimateSpo2(latestVital),
                },
                lastUpdate: latestTimestamp([latestVital.recorded_at, latestNote?.recorded_at, latestProcedure?.scheduled_at]),
            }
        })
        .filter((card) => {
            const keyword = search.value.trim().toLowerCase()
            const matchSearch =
                !keyword ||
                card.name.toLowerCase().includes(keyword) ||
                card.mrn.toLowerCase().includes(keyword) ||
                card.room.toLowerCase().includes(keyword) ||
                card.latestVital.blood_pressure.toLowerCase().includes(keyword) ||
                String(card.metrics.heartRate ?? '').includes(keyword)

            const matchStatus = statusFilter.value === 'all' || card.status === statusFilter.value
            const matchRoom = roomFilter.value === 'all' || card.room === roomFilter.value
            const matchPriority = priorityFilter.value === 'all' || card.priority === priorityFilter.value

            return matchSearch && matchStatus && matchRoom && matchPriority
        })
        .sort((left, right) => new Date(right.lastUpdate).getTime() - new Date(left.lastUpdate).getTime())
})

const selectedPatient = computed(() =>
    patientCards.value.find((item) => item.id === selectedPatientId.value) ?? null,
)

const chartOptions = computed(() => ({
    chart: {
        type: 'line',
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'inherit',
    },
    stroke: {
        curve: 'smooth',
        width: [3, 3, 3, 3],
    },
    colors: ['#2563eb', '#f59e0b', '#ef4444', '#10b981'],
    dataLabels: { enabled: false },
    xaxis: {
        categories: selectedPatient.value?.history.map((item) => formatShortTime(item.recorded_at)) ?? [],
        labels: { style: { colors: '#64748b' } },
    },
    yaxis: {
        labels: { style: { colors: '#64748b' } },
    },
    legend: {
        position: 'top',
        horizontalAlign: 'left',
    },
    grid: {
        borderColor: '#e5e7eb',
    },
    tooltip: {
        shared: true,
    },
}))

const chartSeries = computed(() => {
    const history = selectedPatient.value?.history ?? []

    return [
        {
            name: 'Heart Rate',
            data: history.map((item) => Number(item.pulse ?? 0)),
        },
        {
            name: 'Systolic BP',
            data: history.map((item) => parseBloodPressure(item.blood_pressure)?.systolic ?? 0),
        },
        {
            name: 'Temperature',
            data: history.map((item) => Number(item.temperature ?? 0)),
        },
        {
            name: 'SpO2',
            data: history.map((item) => estimateSpo2(item)),
        },
    ]
})

const loading = computed(() => patientPending.value || vitalPending.value || notePending.value || procedurePending.value)

let realtimeChannel: any = null
let refreshTimer: ReturnType<typeof setTimeout> | null = null
let clockTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
    refreshAll()
    subscribeToRealtime()
    clockTimer = setInterval(() => {
        liveClock.value = new Date()
    }, 30000)
})

onBeforeUnmount(() => {
    if (refreshTimer) {
        clearTimeout(refreshTimer)
        refreshTimer = null
    }

    if (clockTimer) {
        clearInterval(clockTimer)
        clockTimer = null
    }

    const supabase = useSupabase()

    if (supabase && realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
        realtimeChannel = null
    }
})

function openDetail(patientId: string) {
    selectedPatientId.value = patientId
    detailDialog.value = true
}

function refreshAll() {
    refreshPatients()
    refreshVitals()
    refreshNotes()
    refreshProcedures()
    liveClock.value = new Date()
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

function subscribeToRealtime() {
    const supabase = useSupabase()

    if (!supabase) {
        realtimeStatus.value = 'error'
        return
    }

    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
    }

    realtimeChannel = supabase.channel('nurse-monitoring-live')

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

    realtimeChannel
        ?.subscribe((status) => {
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

function formatRelativeTime(dateInput: string) {
    const target = new Date(dateInput)
    const diffMs = liveClock.value.getTime() - target.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

    return target.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

function formatShortTime(value: string) {
    return new Date(value).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    })
}

function formatFullTime(value: string) {
    return new Date(value).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })
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

function deriveStatus(vital: NurseVitalRecord) {
    const pulse = Number(vital.pulse ?? 0)
    const temp = Number(vital.temperature ?? 0)
    const pressure = parseBloodPressure(vital.blood_pressure)
    const systolic = pressure?.systolic ?? 0
    const spo2 = estimateSpo2(vital)

    if (pulse > 120 || pulse < 50 || temp >= 39 || systolic < 90 || spo2 <= 93) {
        return 'Critical'
    }

    if (pulse >= 101 || temp >= 37.5 || systolic < 110 || spo2 <= 96) {
        return 'Need Observation'
    }

    return 'Normal'
}

function deriveRoom(status: 'Normal' | 'Need Observation' | 'Critical') {
    if (status === 'Critical') return 'ICU'
    if (status === 'Need Observation') return 'Observation'
    return 'Ward'
}

function derivePriority(vital: NurseVitalRecord, procedure: NurseProcedure | null, note: NurseCareNote | null) {
    const status = deriveStatus(vital)
    if (status === 'Critical') return 'High'
    if (status === 'Need Observation') return 'Medium'
    if ((procedure?.priority ?? 'Low') === 'High') return 'High'
    if ((note?.category ?? '').toLowerCase().includes('medication')) return 'Medium'
    return 'Low'
}

function estimateSpo2(vital: NurseVitalRecord) {
    const pulse = Number(vital.pulse ?? 0)
    const temp = Number(vital.temperature ?? 0)
    const pressure = parseBloodPressure(vital.blood_pressure)
    const systolic = pressure?.systolic ?? 0

    if (pulse > 120 || pulse < 50 || temp >= 39 || systolic < 90) return 86
    if (pulse >= 101 || temp >= 37.5 || systolic < 110) return 94
    return 98
}

function latestTimestamp(values: Array<string | null | undefined>) {
    return values
        .filter(Boolean)
        .sort((left, right) => new Date(right as string).getTime() - new Date(left as string).getTime())[0] as string
}

function statusColor(status: 'Normal' | 'Need Observation' | 'Critical') {
    if (status === 'Normal') return 'success'
    if (status === 'Need Observation') return 'warning'
    return 'error'
}

function statusBadge(status: 'Normal' | 'Need Observation' | 'Critical') {
    if (status === 'Normal') return 'Normal'
    if (status === 'Need Observation') return 'Need Observation'
    return 'Critical'
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex flex-wrap align-center justify-space-between ga-3">
            <div>
                <div class="text-caption text-uppercase text-medium-emphasis">Nurse Care</div>
                <v-card-title class="text-h4">Patient Monitoring</v-card-title>
                <v-card-subtitle class="mt-1">
                    Realtime patient surveillance from vital signs, care notes, and procedure updates.
                </v-card-subtitle>
            </div>
        </div>
    </v-card-item>

    <v-card elevation="0">
        <v-card-text class="d-flex flex-column ga-4">
            <v-row dense>
                <v-col cols="12" md="4">
                    <v-text-field
                        v-model="search"
                        label="Search patient"
                        placeholder="Search patient, MRN, or room"
                        prepend-inner-icon="mdi-magnify"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                        clearable
                    />
                </v-col>
                <v-col cols="12" md="2">
                    <v-select v-model="statusFilter" :items="statusOptions" item-title="title" item-value="value" label="Status" variant="outlined" density="comfortable" hide-details />
                </v-col>
                <v-col cols="12" md="2">
                    <v-select v-model="roomFilter" :items="roomOptions" item-title="title" item-value="value" label="Room" variant="outlined" density="comfortable" hide-details />
                </v-col>
                <v-col cols="12" md="2">
                    <v-select v-model="priorityFilter" :items="priorityOptions" item-title="title" item-value="value" label="Priority" variant="outlined" density="comfortable" hide-details />
                </v-col>
                <v-col cols="12" md="2" class="d-flex align-end">
                    <v-btn variant="tonal" block @click="refreshVitals(); refreshNotes(); refreshProcedures()">
                        Refresh
                    </v-btn>
                </v-col>
            </v-row>

            <v-row>
                <v-col v-for="card in patientCards" :key="card.id" cols="12" lg="6">
                    <v-card elevation="0" class="monitor-card">
                        <v-card-text class="d-flex flex-column ga-4">
                            <div class="d-flex align-start justify-space-between ga-3">
                                <div>
                                    <div class="text-subtitle-1 font-weight-bold">{{ statusBadge(card.status) }}</div>
                                    <div class="text-h6 mt-1">{{ card.name }}</div>
                                    <div class="text-body-2 text-medium-emphasis">{{ card.mrn }}</div>
                                </div>
                                <div class="d-flex flex-column align-end ga-2">
                                    <v-chip size="small" variant="tonal" :color="statusColor(card.status)">
                                        {{ card.room }}
                                    </v-chip>
                                    <v-chip size="small" variant="tonal" :color="card.priority === 'High' ? 'error' : card.priority === 'Medium' ? 'warning' : 'success'">
                                        {{ card.priority }}
                                    </v-chip>
                                </div>
                            </div>

                            <v-row dense class="monitor-metrics">
                                <v-col cols="6" md="3">
                                    <div class="monitor-metric">
                                        <div class="monitor-metric-icon"><v-icon icon="mdi-heart-pulse" /></div>
                                        <div>
                                            <div class="text-caption text-medium-emphasis">HR</div>
                                            <div class="text-body-1 font-weight-medium">{{ card.metrics.heartRate ?? '-' }}</div>
                                        </div>
                                    </div>
                                </v-col>
                                <v-col cols="6" md="3">
                                    <div class="monitor-metric">
                                        <div class="monitor-metric-icon"><v-icon icon="mdi-water-percent" /></div>
                                        <div>
                                            <div class="text-caption text-medium-emphasis">BP</div>
                                            <div class="text-body-1 font-weight-medium">{{ card.metrics.bloodPressure }}</div>
                                        </div>
                                    </div>
                                </v-col>
                                <v-col cols="6" md="3">
                                    <div class="monitor-metric">
                                        <div class="monitor-metric-icon"><v-icon icon="mdi-thermometer" /></div>
                                        <div>
                                            <div class="text-caption text-medium-emphasis">Temp</div>
                                            <div class="text-body-1 font-weight-medium">{{ card.metrics.temperature != null ? `${card.metrics.temperature} °C` : '-' }}</div>
                                        </div>
                                    </div>
                                </v-col>
                                <v-col cols="6" md="3">
                                    <div class="monitor-metric">
                                        <div class="monitor-metric-icon"><v-icon icon="mdi-lungs" /></div>
                                        <div>
                                            <div class="text-caption text-medium-emphasis">SpO2</div>
                                            <div class="text-body-1 font-weight-medium">{{ card.metrics.spo2 }}%</div>
                                        </div>
                                    </div>
                                </v-col>
                            </v-row>

                            <div class="d-flex flex-column ga-1">
                                <div class="text-caption text-medium-emphasis">Last update</div>
                                <div class="text-body-2">{{ formatRelativeTime(card.lastUpdate) }}</div>
                            </div>

                            <div class="d-flex flex-column ga-2">
                                <div class="text-caption text-medium-emphasis">Latest note</div>
                                <div class="text-body-2">{{ card.latestNote?.note ?? 'No recent care note' }}</div>
                                <div class="text-caption text-medium-emphasis" v-if="card.latestProcedure">
                                    Procedure: {{ card.latestProcedure.procedure_name }}
                                </div>
                            </div>

                            <div class="d-flex justify-end">
                                <v-btn color="primary" variant="flat" prepend-icon="mdi-eye-outline" @click="openDetail(card.id)">
                                    View
                                </v-btn>
                            </div>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>

            <v-card v-if="!loading && patientCards.length === 0" elevation="0" class="monitor-empty">
                <v-card-text class="py-10 text-center text-medium-emphasis">
                    No monitored patients found.
                </v-card-text>
            </v-card>
        </v-card-text>
    </v-card>

    <v-dialog v-model="detailDialog" max-width="1100">
        <v-card v-if="selectedPatient">
            <v-card-title class="d-flex flex-wrap align-center justify-space-between ga-3">
                <div>
                    <div class="text-caption text-uppercase text-medium-emphasis">Patient Detail</div>
                    <div class="text-h5">{{ selectedPatient.name }}</div>
                    <div class="text-body-2 text-medium-emphasis">{{ selectedPatient.mrn }} · {{ selectedPatient.room }}</div>
                </div>
                <v-chip variant="tonal" :color="statusColor(selectedPatient.status)">
                    {{ statusBadge(selectedPatient.status) }}
                </v-chip>
            </v-card-title>
            <v-divider />
            <v-card-text>
                <v-row dense>
                    <v-col cols="12" lg="7">
                        <v-card variant="tonal" color="primary" class="pa-4 h-100">
                            <apexchart type="line" height="340" :options="chartOptions" :series="chartSeries" />
                        </v-card>
                    </v-col>
                    <v-col cols="12" lg="5">
                        <v-card variant="flat" class="monitor-detail-box h-100">
                            <div class="monitor-detail-grid">
                                <div>
                                    <div class="text-caption text-medium-emphasis">Heart Rate</div>
                                    <div class="text-h6">{{ selectedPatient.metrics.heartRate ?? '-' }}</div>
                                </div>
                                <div>
                                    <div class="text-caption text-medium-emphasis">Blood Pressure</div>
                                    <div class="text-h6">{{ selectedPatient.metrics.bloodPressure }}</div>
                                </div>
                                <div>
                                    <div class="text-caption text-medium-emphasis">Temperature</div>
                                    <div class="text-h6">{{ selectedPatient.metrics.temperature != null ? `${selectedPatient.metrics.temperature} °C` : '-' }}</div>
                                </div>
                                <div>
                                    <div class="text-caption text-medium-emphasis">SpO2</div>
                                    <div class="text-h6">{{ selectedPatient.metrics.spo2 }}%</div>
                                </div>
                                <div>
                                    <div class="text-caption text-medium-emphasis">Priority</div>
                                    <div class="text-h6">{{ selectedPatient.priority }}</div>
                                </div>
                                <div>
                                    <div class="text-caption text-medium-emphasis">Last Update</div>
                                    <div class="text-h6">{{ formatFullTime(selectedPatient.lastUpdate) }}</div>
                                </div>
                            </div>

                            <v-divider class="my-4" />

                            <div class="text-caption text-uppercase text-medium-emphasis">Latest care note</div>
                            <div class="text-body-2 mt-1">{{ selectedPatient.latestNote?.note ?? 'No recent care note available.' }}</div>

                            <div class="text-caption text-uppercase text-medium-emphasis mt-4">Latest procedure</div>
                            <div class="text-body-2 mt-1">
                                {{ selectedPatient.latestProcedure?.procedure_name ?? 'No recent procedure.' }}
                            </div>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-card-actions class="justify-end">
                <v-btn variant="text" @click="detailDialog = false">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style scoped>
.monitor-card {
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: none;
}

.monitor-metric {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 14px;
    min-height: 72px;
}

.monitor-metric-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 999px;
    background: rgba(var(--v-theme-primary), 0.08);
    color: rgb(var(--v-theme-primary));
    flex-shrink: 0;
}

.monitor-detail-box {
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 16px;
    padding: 20px;
}

.monitor-detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
}

.monitor-empty {
    border: 1px dashed rgba(0, 0, 0, 0.12);
    box-shadow: none;
}

@media (max-width: 960px) {
    .monitor-detail-grid {
        grid-template-columns: 1fr;
    }
}
</style>
