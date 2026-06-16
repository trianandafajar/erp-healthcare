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
const historyDateSelection = ref<Array<string | Date>>([])
const editingVitalId = ref<string | null>(null)
const deleteDialog = ref(false)
const selectedVital = ref<NurseVitalRecord | null>(null)
const submitting = ref(false)

const historyPatientOptions = computed(() => [
    { title: 'All patients', value: 'all' },
    ...patientOptions.value,
])

const historyDateLabel = computed(() => {
    const selectedDates = getSelectedDateKeys()

    if (selectedDates.length === 1) {
        return formatFriendlyDate(selectedDates[0])
    }

    if (selectedDates.length >= 2) {
        return `${formatFriendlyDate(selectedDates[0])} — ${formatFriendlyDate(selectedDates[selectedDates.length - 1])}`
    }

    return 'Any date'
})

const filteredVitals = computed(() => {
    const keyword = historySearch.value.trim().toLowerCase()
    const selectedDates = getSelectedDateKeys()
    const [singleDate, rangeStart, rangeEnd] = (() => {
        if (selectedDates.length === 1) {
            return [selectedDates[0], null, null] as const
        }

        if (selectedDates.length >= 2) {
            return [null, selectedDates[0], selectedDates[selectedDates.length - 1]] as const
        }

        return [null, null, null] as const
    })()
    const hasRange = rangeStart !== null && rangeEnd !== null

    return recentVitals.value.filter((item) => {
        const matchPatient = historyPatientFilter.value === 'all' || item.patient_id === historyPatientFilter.value
        const itemDateKey = toDateKey(item.recorded_at)
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

watch(
    patientOptions,
    (options) => {
        if (!form.patientId && options[0]?.value) {
            form.patientId = options[0].value
        }
    },
    { immediate: true },
)

function resetForm() {
    form.patientId = patientOptions.value[0]?.value ?? ''
    form.bloodPressure = ''
    form.temperature = ''
    form.weight = ''
    form.height = ''
    form.pulse = ''
    form.notes = ''
    editingVitalId.value = null
}

function startEdit(vital: NurseVitalRecord) {
    editingVitalId.value = vital.id
    form.patientId = vital.patient_id
    form.bloodPressure = vital.blood_pressure ?? ''
    form.temperature = vital.temperature != null ? String(vital.temperature) : ''
    form.weight = vital.weight != null ? String(vital.weight) : ''
    form.height = vital.height != null ? String(vital.height) : ''
    form.pulse = vital.pulse != null ? String(vital.pulse) : ''
    form.notes = vital.notes ?? ''
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

function askDelete(vital: NurseVitalRecord) {
    selectedVital.value = vital
    deleteDialog.value = true
}

async function submitVital() {
    if (!form.patientId || submitting.value) return

    submitting.value = true

    try {
        await $fetch('/api/nurse/vitals', {
            method: editingVitalId.value ? 'PUT' : 'POST',
            body: editingVitalId.value
                ? {
                      id: editingVitalId.value,
                      patient_id: form.patientId,
                      blood_pressure: form.bloodPressure,
                      temperature: form.temperature,
                      weight: form.weight,
                      height: form.height,
                      pulse: form.pulse,
                      notes: form.notes,
                  }
                : {
                      patient_id: form.patientId,
                      blood_pressure: form.bloodPressure,
                      temperature: form.temperature,
                      weight: form.weight,
                      height: form.height,
                      pulse: form.pulse,
                      notes: form.notes,
                  },
        })

        resetForm()
        await refresh()
    } finally {
        submitting.value = false
    }
}

async function deleteSelectedVital() {
    if (!selectedVital.value || submitting.value) return

    submitting.value = true

    try {
        await $fetch('/api/nurse/vitals', {
            method: 'DELETE',
            body: { id: selectedVital.value.id },
        })

        deleteDialog.value = false
        selectedVital.value = null
        await refresh()
    } finally {
        submitting.value = false
    }
}

function clearHistoryDateFilter() {
    historyDateSelection.value = []
}

function toDateKey(value: string | Date) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

function formatFriendlyDate(value: string) {
    const [year, month, day] = value.split('-').map(Number)
    const date = new Date(year, month - 1, day)

    return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

function getSelectedDateKeys() {
    return historyDateSelection.value
        .map((value) => toDateKey(value))
        .filter(Boolean)
        .sort()
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })
}
</script>

<template>
    <div>
    <v-row>
        <v-col cols="12" lg="5">
            <v-card elevation="0" class="h-100">
                <v-card-item class="pb-2">
                    <v-card-title class="text-h5">{{ editingVitalId ? 'Edit Vital Signs' : 'Vital Sign Entry' }}</v-card-title>
                    <v-card-subtitle>Record live patient assessment data</v-card-subtitle>
                </v-card-item>
                <v-divider />
                <v-card-text>
                    <v-form class="d-flex flex-column ga-4" @submit.prevent="submitVital">
                        <v-autocomplete
                            v-model="form.patientId"
                            :items="patientOptions"
                            :loading="patientPending"
                            item-title="title"
                            item-value="value"
                            label="Patient"
                            placeholder="Search patient..."
                            variant="outlined"
                            density="comfortable"
                            clearable
                        />
                        <v-text-field v-model="form.bloodPressure" label="Blood pressure" placeholder="120/80" variant="outlined" density="comfortable" />
                        <v-row dense>
                            <v-col cols="12" md="6">
                                <v-text-field v-model="form.temperature" label="Temperature" placeholder="36.8" suffix="°C" variant="outlined" density="comfortable" />
                            </v-col>
                            <v-col cols="12" md="6">
                                <v-text-field v-model="form.pulse" label="Pulse" placeholder="78" suffix="bpm" variant="outlined" density="comfortable" />
                            </v-col>
                        </v-row>
                        <v-row dense>
                            <v-col cols="12" md="6">
                                <v-text-field v-model="form.weight" label="Weight" placeholder="60" suffix="kg" variant="outlined" density="comfortable" />
                            </v-col>
                            <v-col cols="12" md="6">
                                <v-text-field v-model="form.height" label="Height" placeholder="165" suffix="cm" variant="outlined" density="comfortable" />
                            </v-col>
                        </v-row>
                        <v-textarea v-model="form.notes" label="Short note" rows="3" variant="outlined" density="comfortable" />
                        <div class="d-flex ga-2 flex-wrap">
                            <v-btn type="submit" color="primary" variant="flat" size="large" :loading="submitting">
                                {{ editingVitalId ? 'Update vital signs' : 'Save vital signs' }}
                            </v-btn>
                            <v-btn v-if="editingVitalId" variant="tonal" color="secondary" size="large" @click="resetForm">
                                Cancel edit
                            </v-btn>
                        </div>
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
                        <v-col cols="12" md="5">
                            <v-text-field
                                v-model="historySearch"
                                density="comfortable"
                                hide-details
                                clearable
                                label="Search history"
                                placeholder="Search name, MRN, or vital values..."
                                prepend-inner-icon="mdi-magnify"
                                variant="outlined"
                            />
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-autocomplete
                                v-model="historyPatientFilter"
                                :items="historyPatientOptions"
                                density="comfortable"
                                hide-details
                                item-title="title"
                                item-value="value"
                                label="Filter by patient"
                                placeholder="Search patient..."
                                variant="outlined"
                                clearable
                            />
                        </v-col>
                        <v-col cols="12" md="3">
                            <v-menu v-model="historyDateMenu" :close-on-content-click="false" location="bottom start">
                                <template #activator="{ props }">
                                    <v-text-field
                                        v-bind="props"
                                        :model-value="historyDateLabel"
                                        density="comfortable"
                                        hide-details
                                        label="Filter by date"
                                        readonly
                                        clearable
                                        variant="outlined"
                                        @click:clear="clearHistoryDateFilter"
                                    />
                                </template>

                                <v-card width="360" elevation="8">
                                    <v-card-text>
                                        <v-date-picker v-model="historyDateSelection" multiple="range" color="primary" hide-header />
                                        <div class="d-flex justify-end mt-2">
                                            <v-btn variant="text" color="primary" @click="clearHistoryDateFilter">
                                                Clear
                                            </v-btn>
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-menu>
                        </v-col>
                    </v-row>
                </v-card-text>
                <v-divider />
                <v-card-text class="d-flex flex-column ga-3">
                    <v-card
                        v-for="vital in filteredVitals"
                        :key="vital.id"
                        class="vital-history-card"
                        variant="outlined"
                        rounded="lg"
                    >
                        <v-card-text class="pa-4">
                            <div class="d-flex align-start justify-space-between ga-4">
                                <div class="min-w-0 flex-grow-1">
                                    <div class="d-flex align-center ga-2 flex-wrap mb-1">
                                        <div class="text-body-1 font-weight-semibold text-truncate">{{ vital.patient_name }}</div>
                                        <v-chip size="x-small" variant="tonal" color="primary" label>
                                            {{ vital.medical_record_number }}
                                        </v-chip>
                                    </div>
                                    <div class="text-caption text-medium-emphasis">{{ formatDate(vital.recorded_at) }}</div>
                                </div>
                                <div class="d-flex ga-2">
                                    <v-btn size="small" variant="text" color="secondary" prepend-icon="mdi-pencil-outline" @click="startEdit(vital)">
                                        Edit
                                    </v-btn>
                                    <v-btn size="small" variant="text" color="error" prepend-icon="mdi-delete-outline" @click="askDelete(vital)">
                                        Delete
                                    </v-btn>
                                </div>
                            </div>

                            <v-row class="mt-2" dense>
                                <v-col cols="12" md="4">
                                    <div class="text-caption text-medium-emphasis">Blood pressure</div>
                                    <div class="text-body-2 font-weight-medium">{{ vital.blood_pressure }}</div>
                                </v-col>
                                <v-col cols="6" md="2">
                                    <div class="text-caption text-medium-emphasis">Temp</div>
                                    <div class="text-body-2 font-weight-medium">{{ vital.temperature ?? '-' }} °C</div>
                                </v-col>
                                <v-col cols="6" md="2">
                                    <div class="text-caption text-medium-emphasis">Pulse</div>
                                    <div class="text-body-2 font-weight-medium">{{ vital.pulse ?? '-' }}</div>
                                </v-col>
                                <v-col cols="6" md="2">
                                    <div class="text-caption text-medium-emphasis">Weight</div>
                                    <div class="text-body-2 font-weight-medium">{{ vital.weight ?? '-' }} kg</div>
                                </v-col>
                                <v-col cols="6" md="2">
                                    <div class="text-caption text-medium-emphasis">Height</div>
                                    <div class="text-body-2 font-weight-medium">{{ vital.height ?? '-' }} cm</div>
                                </v-col>
                            </v-row>

                            <div class="mt-3 text-body-2 text-medium-emphasis note-line">
                                {{ vital.notes ?? '-' }}
                            </div>
                        </v-card-text>
                    </v-card>

                    <div v-if="pending" class="text-center py-8">
                        <v-progress-circular indeterminate color="primary" />
                    </div>
                    <div v-else-if="filteredVitals.length === 0" class="text-center py-8 text-medium-emphasis">
                        No vital signs recorded yet
                    </div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>

    <v-dialog v-model="deleteDialog" max-width="420">
        <v-card>
            <v-card-title class="text-h6">Delete vital signs?</v-card-title>
            <v-card-text>
                This record will be removed permanently.
            </v-card-text>
            <v-card-actions class="justify-end">
                <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
                <v-btn color="error" variant="flat" :loading="submitting" @click="deleteSelectedVital">Delete</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
    </div>
</template>

<style scoped>
.vital-history-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.vital-history-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
}

.note-line {
    white-space: pre-wrap;
    line-height: 1.6;
}
</style>
