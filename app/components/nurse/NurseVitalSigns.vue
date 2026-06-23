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

const { can } = usePermission()

const { data: patientData, pending: patientPending } = useLazyFetch<{ patients: NursePatientOption[] }>('/api/nurse/patients')
const { data: vitalData, pending, refresh } = useLazyFetch<{ vitals: NurseVitalRecord[] }>('/api/nurse/vitals')

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
const submitting = ref(false)
const dialog = ref(false)
const editingVitalId = ref<string | null>(null)
const selectedVital = ref<NurseVitalRecord | null>(null)
const deleteDialog = ref(false)

const historyPatientOptions = computed(() => [
    { title: 'All patients', value: 'all' },
    ...patientOptions.value,
])

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

const selectedDateKeys = computed(() =>
    historyDateSelection.value
        .map((value) => toDateKey(value))
        .filter(Boolean)
        .sort(),
)

const historyDateLabel = computed(() => {
    if (selectedDateKeys.value.length === 1) {
        return formatFriendlyDate(selectedDateKeys.value[0])
    }

    if (selectedDateKeys.value.length >= 2) {
        return `${formatFriendlyDate(selectedDateKeys.value[0])} — ${formatFriendlyDate(selectedDateKeys.value[selectedDateKeys.value.length - 1])}`
    }

    return 'Any date'
})

const filteredVitals = computed(() => {
    const keyword = historySearch.value.trim().toLowerCase()
    const singleDate = selectedDateKeys.value.length === 1 ? selectedDateKeys.value[0] : null
    const rangeStart = selectedDateKeys.value.length >= 2 ? selectedDateKeys.value[0] : null
    const rangeEnd = selectedDateKeys.value.length >= 2 ? selectedDateKeys.value[selectedDateKeys.value.length - 1] : null

    return recentVitals.value.filter((item) => {
        const matchPatient = historyPatientFilter.value === 'all' || item.patient_id === historyPatientFilter.value
        const itemDateKey = toDateKey(item.recorded_at)
        const matchSingleDay = !singleDate || itemDateKey === singleDate
        const matchRange = !rangeStart || !rangeEnd || (itemDateKey >= rangeStart && itemDateKey <= rangeEnd)
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

function openAddDialog() {
    editingVitalId.value = null
    resetForm()
    dialog.value = true
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
    dialog.value = true
}

function askDelete(vital: NurseVitalRecord) {
    selectedVital.value = vital
    deleteDialog.value = true
}

function resetForm() {
    form.patientId = patientOptions.value[0]?.value ?? ''
    form.bloodPressure = ''
    form.temperature = ''
    form.weight = ''
    form.height = ''
    form.pulse = ''
    form.notes = ''
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

        dialog.value = false
        editingVitalId.value = null
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

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex flex-wrap align-center justify-space-between ga-3">
            <div>
                <div class="text-caption text-uppercase text-medium-emphasis">Nurse Care</div>
                <v-card-title class="text-h4">Vital Sign History</v-card-title>
                <v-card-subtitle class="mt-1">Latest recorded entries from the database.</v-card-subtitle>
            </div>
            <v-btn v-if="can('vitals.create')" color="primary" variant="flat" size="large" prepend-icon="mdi-plus"
                density="comfortable" @click="openAddDialog">
                Create Vital Sign
            </v-btn>
        </div>
    </v-card-item>

    <v-card elevation="0">
        <div class="d-flex align-center p-4 ga-3 flex-wrap justify-space-between">
            <v-text-field v-model="historySearch" density="comfortable" hide-details clearable label="Search history"
                placeholder="Search name, MRN, or vital values..." prepend-inner-icon="mdi-magnify" variant="outlined"
                style="min-width: 340px; max-width: 420px; flex: 1 1 360px" />
            <div class="d-flex align-center ga-2 flex-wrap">
                <v-autocomplete v-model="historyPatientFilter" :items="historyPatientOptions" density="comfortable"
                    hide-details item-title="title" item-value="value" label="Filter by patient"
                    placeholder="Search patient..." variant="outlined" clearable
                    style="min-width: 280px; max-width: 360px" />
                <v-menu v-model="historyDateMenu" :close-on-content-click="false" location="bottom start">
                    <template #activator="{ props }">
                        <v-text-field v-bind="props" :model-value="historyDateLabel" density="comfortable" hide-details
                            label="Filter by date" readonly clearable variant="outlined"
                            style="min-width: 220px; max-width: 260px" @click:clear="clearHistoryDateFilter" />
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
            </div>
        </div>

        <v-table hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Patient</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Vitals</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Note</th>
                    <th class="text-right text-caption font-weight-bold text-uppercase">Time</th>
                    <th class="text-right text-caption font-weight-bold text-uppercase">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending">
                    <td colspan="5" class="text-center py-8">
                        <v-progress-circular indeterminate color="primary" />
                    </td>
                </tr>
                <tr v-else-if="filteredVitals.length === 0">
                    <td colspan="5" class="text-center py-8 text-medium-emphasis">
                        No vital signs recorded yet
                    </td>
                </tr>
                <tr v-else v-for="vital in filteredVitals" :key="vital.id">
                    <td class="py-3">
                        <div class="text-body-2 font-weight-medium">{{ vital.patient_name }}</div>
                        <div class="text-caption text-medium-emphasis">{{ vital.medical_record_number }}</div>
                    </td>
                    <td class="py-3 text-body-2">
                        <div>BP: {{ vital.blood_pressure }}</div>
                        <div>Temp: {{ vital.temperature ?? '-' }} °C | Pulse: {{ vital.pulse ?? '-' }}</div>
                        <div>Wt/Ht: {{ vital.weight ?? '-' }} kg / {{ vital.height ?? '-' }} cm</div>
                    </td>
                    <td class="py-3 text-body-2 text-medium-emphasis">
                        {{ vital.notes ?? '-' }}
                    </td>
                    <td class="py-3 text-right text-caption text-medium-emphasis">
                        {{ formatDate(vital.recorded_at) }}
                    </td>
                    <td class="py-3 text-right">
                        <v-btn v-if="can('vitals.edit')" icon="mdi-pencil-outline" variant="text" size="small"
                            color="secondary" @click="startEdit(vital)" />
                        <v-btn v-if="can('vitals.delete')" icon="mdi-delete-outline" variant="text" size="small"
                            color="error" @click="askDelete(vital)" />
                    </td>
                </tr>
            </tbody>
        </v-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="640">
        <v-card>
            <v-card-title class="text-h6">
                {{ editingVitalId ? 'Edit Vital Signs' : 'Add Vital Signs' }}
            </v-card-title>
            <v-card-text>
                <v-form class="d-flex flex-column ga-4" @submit.prevent="submitVital">
                    <v-autocomplete v-model="form.patientId" :items="patientOptions" :loading="patientPending"
                        item-title="title" item-value="value" label="Patient" placeholder="Search patient..."
                        variant="outlined" density="comfortable" clearable />
                    <v-text-field v-model="form.bloodPressure" label="Blood pressure" placeholder="120/80"
                        variant="outlined" density="comfortable" />
                    <v-row dense>
                        <v-col cols="12" md="6">
                            <v-text-field v-model="form.temperature" label="Temperature" placeholder="36.8" suffix="°C"
                                variant="outlined" density="comfortable" />
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
                    <div class="d-flex ga-2 justify-end">
                        <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
                        <v-btn type="submit" color="primary" variant="flat" :loading="submitting">
                            {{ editingVitalId ? 'Update' : 'Save' }}
                        </v-btn>
                    </div>
                </v-form>
            </v-card-text>
        </v-card>
    </v-dialog>

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
</template>
