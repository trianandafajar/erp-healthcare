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

const { data: patientData, pending: patientPending } = await useFetch<{ patients: NursePatientOption[] }>('/api/nurse/patients')
const { data: vitalData, pending, refresh } = await useFetch<{ vitals: NurseVitalRecord[] }>('/api/nurse/vitals')

const patientOptions = computed(() =>
    (patientData.value?.patients ?? []).map((patient) => ({
        title: `${patient.full_name} • ${patient.medical_record_number}`,
        value: patient.id,
    })),
)

const recentVitals = computed(() => vitalData.value?.vitals ?? [])
const historySearch = ref('')
const historyPatientFilter = ref('all')
const historyDateMenu = ref(false)
const historyDateSelection = ref<string[]>([])

const historyPatientOptions = computed(() => [
    { title: 'All patients', value: 'all' },
    ...patientOptions.value,
])

const historyDateLabel = computed(() => {
    if (historyDateSelection.value.length === 1) {
        return historyDateSelection.value[0]
    }

    if (historyDateSelection.value.length >= 2) {
        const [startDate, endDate] = [...historyDateSelection.value].sort()
        return `${startDate} — ${endDate}`
    }

    return 'Any date'
})

const filteredVitals = computed(() => {
    const keyword = historySearch.value.trim().toLowerCase()
    const [singleDate, rangeStart, rangeEnd] = (() => {
        if (historyDateSelection.value.length === 1) {
            return [historyDateSelection.value[0], null, null] as const
        }

        if (historyDateSelection.value.length >= 2) {
            const [startDate, endDate] = [...historyDateSelection.value].sort()
            return [null, startDate, endDate] as const
        }

        return [null, null, null] as const
    })()
    const hasRange = rangeStart !== null && rangeEnd !== null

    return recentVitals.value.filter((item) => {
        const matchPatient = historyPatientFilter.value === 'all' || item.patient_id === historyPatientFilter.value
        const itemDateKey = new Date(item.recorded_at).toISOString().slice(0, 10)
        const matchSingleDay = !singleDate || itemDateKey === singleDate
        const matchRange = !hasRange || (rangeStart !== null && rangeEnd !== null && itemDateKey >= rangeStart && itemDateKey <= rangeEnd)
        const matchSearch =
            !keyword ||
            item.patient_name.toLowerCase().includes(keyword) ||
            item.medical_record_number.toLowerCase().includes(keyword) ||
            item.blood_pressure.toLowerCase().includes(keyword) ||
            String(item.temperature ?? '').toLowerCase().includes(keyword) ||
            String(item.weight ?? '').toLowerCase().includes(keyword) ||
            String(item.height ?? '').toLowerCase().includes(keyword) ||
            String(item.pulse ?? '').toLowerCase().includes(keyword) ||
            String(item.notes ?? '').toLowerCase().includes(keyword)

        return matchPatient && matchSingleDay && matchRange && matchSearch
    })
})

const form = reactive({
    patientId: '',
    bloodPressure: '',
    temperature: '',
    weight: '',
    height: '',
    pulse: '',
    notes: '',
})

const submitting = ref(false)

watch(
    patientOptions,
    (options) => {
        if (!form.patientId && options[0]?.value) {
            form.patientId = options[0].value
        }
    },
    { immediate: true },
)

async function submitVital() {
    if (!form.patientId || submitting.value) return

    submitting.value = true

    try {
        await $fetch('/api/nurse/vitals', {
            method: 'POST',
            body: {
                patient_id: form.patientId,
                blood_pressure: form.bloodPressure,
                temperature: form.temperature,
                weight: form.weight,
                height: form.height,
                pulse: form.pulse,
                notes: form.notes,
            },
        })

        form.bloodPressure = ''
        form.temperature = ''
        form.weight = ''
        form.height = ''
        form.pulse = ''
        form.notes = ''

        await refresh()
    } finally {
        submitting.value = false
    }
}

function clearHistoryDateFilter() {
    historyDateSelection.value = []
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })
}
</script>

<template>
    <v-row>
        <v-col cols="12" lg="5">
            <v-card elevation="0" class="h-100">
                <v-card-item class="pb-2">
                    <v-card-title class="text-h5">Vital Sign Entry</v-card-title>
                    <v-card-subtitle>Record live patient assessment data</v-card-subtitle>
                </v-card-item>
                <v-divider />
                <v-card-text>
                    <v-form class="d-flex flex-column ga-4" @submit.prevent="submitVital">
                        <v-autocomplete v-model="form.patientId" :items="patientOptions" :loading="patientPending"
                            item-title="title" item-value="value" label="Patient" placeholder="Search patient..."
                            variant="outlined" density="comfortable" clearable />
                        <v-text-field v-model="form.bloodPressure" label="Blood pressure" placeholder="120/80"
                            variant="outlined" density="comfortable" />
                        <v-row dense>
                            <v-col cols="12" md="6">
                                <v-text-field v-model="form.temperature" label="Temperature" placeholder="36.8"
                                    suffix="°C" variant="outlined" density="comfortable" />
                            </v-col>
                            <v-col cols="12" md="6">
                                <v-text-field v-model="form.pulse" label="Pulse" placeholder="78" suffix="bpm"
                                    variant="outlined" density="comfortable" />
                            </v-col>
                        </v-row>
                        <v-row dense>
                            <v-col cols="12" md="6">
                                <v-text-field v-model="form.weight" label="Weight" placeholder="60" suffix="kg"
                                    variant="outlined" density="comfortable" />
                            </v-col>
                            <v-col cols="12" md="6">
                                <v-text-field v-model="form.height" label="Height" placeholder="165" suffix="cm"
                                    variant="outlined" density="comfortable" />
                            </v-col>
                        </v-row>
                        <v-textarea v-model="form.notes" label="Short note" rows="3" variant="outlined"
                            density="comfortable" />
                        <v-btn type="submit" color="primary" variant="flat" size="large" :loading="submitting">
                            Save vital signs
                        </v-btn>
                    </v-form>
                </v-card-text>
            </v-card>
        </v-col>
        <v-col cols="12" lg="7">
            <v-card elevation="0" class="h-100">
                <v-card-item class="pb-2">
                    <v-card-title class="text-h5">Vital Sign History</v-card-title>
                    <v-card-subtitle>Latest recorded entries</v-card-subtitle>
                </v-card-item>
                <v-divider />
                <v-card-text class="pa-4">
                    <v-row dense>
                        <!-- Search -->
                        <v-col cols="12">
                            <v-text-field v-model="historySearch" density="comfortable" hide-details clearable
                                label="Search history" placeholder="Search name, MRN, or vital values..."
                                prepend-inner-icon="mdi-magnify" variant="outlined" />
                        </v-col>

                        <!-- Date Filter -->
                        <v-col cols="12" md="6">
                            <v-menu v-model="historyDateMenu" :close-on-content-click="false" location="bottom start">
                                <template #activator="{ props }">
                                    <v-text-field v-bind="props" :model-value="historyDateLabel" density="comfortable"
                                        hide-details label="Filter by date" readonly clearable variant="outlined"
                                        @click:clear="clearHistoryDateFilter" />
                                </template>

                                <v-card width="360" elevation="8">
                                    <v-card-text>
                                        <v-date-picker v-model="historyDateSelection" multiple="range" color="primary"
                                            hide-header />

                                        <div class="d-flex justify-end mt-2">
                                            <v-btn variant="text" color="primary" @click="clearHistoryDateFilter">
                                                Clear
                                            </v-btn>
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-menu>
                        </v-col>

                        <!-- Patient Filter -->
                        <v-col cols="12" md="6">
                            <v-autocomplete v-model="historyPatientFilter" :items="historyPatientOptions"
                                density="comfortable" hide-details item-title="title" item-value="value"
                                label="Filter by patient" placeholder="Search patient..." variant="outlined"
                                clearable />
                        </v-col>
                    </v-row>
                </v-card-text>
                <v-divider />
                <v-table hover density="comfortable">
                    <thead class="bg-containerBg">
                        <tr>
                            <th class="text-left text-caption font-weight-bold text-uppercase">Patient</th>
                            <th class="text-left text-caption font-weight-bold text-uppercase">Vitals</th>
                            <th class="text-left text-caption font-weight-bold text-uppercase">Note</th>
                            <th class="text-right text-caption font-weight-bold text-uppercase">Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="pending">
                            <td colspan="4" class="text-center py-8">
                                <v-progress-circular indeterminate color="primary" />
                            </td>
                        </tr>
                        <tr v-else-if="filteredVitals.length === 0">
                            <td colspan="4" class="text-center py-8 text-medium-emphasis">
                                No vital signs recorded yet
                            </td>
                        </tr>
                        <tr v-else v-for="item in filteredVitals" :key="item.id">
                            <td class="py-3">
                                <div class="text-body-2 font-weight-medium">{{ item.patient_name }}</div>
                                <div class="text-caption text-medium-emphasis">{{ item.medical_record_number }}</div>
                            </td>
                            <td class="py-3 text-body-2">
                                <div>BP: {{ item.blood_pressure }}</div>
                                <div>Temp: {{ item.temperature ?? '-' }} °C | Pulse: {{ item.pulse ?? '-' }}</div>
                                <div>Wt/Ht: {{ item.weight ?? '-' }} kg / {{ item.height ?? '-' }} cm</div>
                            </td>
                            <td class="py-3 text-body-2 text-medium-emphasis">
                                {{ item.notes ?? '-' }}
                            </td>
                            <td class="py-3 text-right text-caption text-medium-emphasis">
                                {{ formatDate(item.recorded_at) }}
                            </td>
                        </tr>
                    </tbody>
                </v-table>
            </v-card>
        </v-col>
    </v-row>
</template>
