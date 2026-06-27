<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import CreatePatientDialog from '../doctor/appointment/CreatePatientDialog.vue'

type NursePatientOption = {
    id: string
    full_name: string
    medical_record_number: string
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

type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'

const { can } = usePermission()

const { data: patientData, pending: patientPending, refresh: refreshPatients } = useLazyFetch<{ patients: NursePatientOption[] }>('/api/nurse/patients')
const { data: procedureData, pending, refresh } = useLazyFetch<{ procedures: NurseProcedure[] }>('/api/nurse/procedures')

const patientOptions = computed(() =>
    (patientData.value?.patients ?? []).map((patient) => ({
        title: `${patient.full_name} - ${patient.medical_record_number}`,
        value: patient.id,
    })),
)

const procedures = computed(() => procedureData.value?.procedures ?? [])
const viewTab = ref<'calendar' | 'list'>('calendar')
const calendarView = ref<CalendarView>('dayGridMonth')
const calendarRef = ref<any>(null)
const calendarTitle = ref('')
const selectedDateKey = ref<string | null>(null)
const selectedDateTime = ref<string | null>(null)
const dateDialog = ref(false)
const dialog = ref(false)
const deleteDialog = ref(false)
const selectedProcedure = ref<NurseProcedure | null>(null)
const editingProcedureId = ref<string | null>(null)
const submitting = ref(false)
const currentPage = ref(1)
const itemsPerPage = 8
const search = ref('')
const categoryFilter = ref('all')
const statusFilter = ref('all')
const dialogCreatePatient = ref(false)

const categoryOptions = [
    { title: 'All categories', value: 'all' },
    { title: 'Planned', value: 'Planned' },
    { title: 'In Progress', value: 'In Progress' },
    { title: 'Completed', value: 'Completed' },
]

const priorityOptions = [
    { title: 'All priorities', value: 'all' },
    { title: 'Low', value: 'Low' },
    { title: 'Medium', value: 'Medium' },
    { title: 'High', value: 'High' },
]

const form = reactive({
    patientId: '',
    procedureName: '',
    startAt: '',
    endAt: '',
    priority: 'Medium' as NurseProcedure['priority'],
    status: 'Planned' as NurseProcedure['status'],
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

const filteredProcedures = computed(() => {
    const keyword = search.value.trim().toLowerCase()

    return procedures.value.filter((item) =>
        (categoryFilter.value === 'all' || item.status === categoryFilter.value) &&
        (statusFilter.value === 'all' || item.priority === statusFilter.value) &&
        [
            item.patient_name,
            item.medical_record_number,
            item.procedure_name,
            item.priority,
            item.status,
            item.notes,
            item.scheduled_at,
            item.ended_at ?? '',
        ]
            .join(' ')
            .toLowerCase()
            .includes(keyword),
    )
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredProcedures.value.length / itemsPerPage)))
const paginatedProcedures = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    return filteredProcedures.value.slice(start, start + itemsPerPage)
})
const selectedProcedures = computed(() =>
    selectedDateKey.value ? procedures.value.filter((item) => toDateKey(item.scheduled_at) === selectedDateKey.value) : [],
)
const selectedDateLabel = computed(() => (selectedDateKey.value ? formatFriendlyDate(selectedDateKey.value) : ''))
const calendarViewLabel = computed(() => {
    if (calendarView.value === 'dayGridMonth') return 'Month'
    if (calendarView.value === 'timeGridWeek') return 'Week'
    return 'Day'
})

const calendarEvents = computed(() =>
    procedures.value.map((procedure) => ({
        id: procedure.id,
        title: `${procedure.patient_name} - ${procedure.procedure_name}`,
        start: procedure.scheduled_at,
        end: procedure.ended_at ?? undefined,
        backgroundColor: getPriorityColor(procedure.priority),
        borderColor: getPriorityColor(procedure.priority),
        extendedProps: {
            id: procedure.id,
            patientName: procedure.patient_name,
            procedureName: procedure.procedure_name,
            mrn: procedure.medical_record_number,
            startAt: procedure.scheduled_at,
            endAt: procedure.ended_at,
            priority: procedure.priority,
            status: procedure.status,
            notes: procedure.notes,
            recordedBy: procedure.recorded_by_name,
        },
    })),
)

const calendarOptions = computed(() => ({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: calendarView.value,
    headerToolbar: false,
    events: calendarEvents.value,
    height: 'auto',
    dayMaxEvents: 3,
    eventDisplay: 'block',
    nowIndicator: true,
    firstDay: 0,
    slotMinTime: '00:00:00',
    slotMaxTime: '23:59:59',
    dateClick: handleDateClick,
    eventDidMount: handleEventDidMount,
    datesSet: handleDatesSet,
}))

watch(calendarView, (view) => {
    calendarRef.value?.getApi?.().changeView(view)
})

watch(totalPages, () => {
    if (currentPage.value > totalPages.value) {
        currentPage.value = totalPages.value
    }
})

function handleDatesSet(info: { view: { title: string } }) {
    calendarTitle.value = info.view.title
}

function openCreateDialog(dateInput?: string) {
    editingProcedureId.value = null
    resetForm()
    if (dateInput) {
        form.startAt = toDatetimeLocal(dateInput)
        form.endAt = toDatetimeLocal(new Date(new Date(dateInput).getTime() + 60 * 60 * 1000).toISOString())
    }
    dialog.value = true
}

function openCreatePatient() {
    dialogCreatePatient.value = true
}

function onCreatedPatient(newPatient: any | null) {
    if (newPatient?.id) {
        form.patientId = newPatient.id
        refreshPatients()
    }
    dialogCreatePatient.value = false
}

function openEditDialog(procedure: NurseProcedure) {
    editingProcedureId.value = procedure.id
    form.patientId = procedure.patient_id
    form.procedureName = procedure.procedure_name
    form.startAt = toDatetimeLocal(procedure.scheduled_at)
    form.endAt = procedure.ended_at ? toDatetimeLocal(procedure.ended_at) : ''
    form.priority = procedure.priority
    form.status = procedure.status
    form.notes = procedure.notes
    dialog.value = true
}

function askDelete(procedure: NurseProcedure) {
    selectedProcedure.value = procedure
    deleteDialog.value = true
}

function openDateDialog(dateInput: string) {
    selectedDateKey.value = toDateKey(dateInput)
    selectedDateTime.value = dateInput
    dateDialog.value = true
}

function handleDateClick(info: { dateStr: string }) {
    if (calendarView.value === 'timeGridWeek' || calendarView.value === 'timeGridDay') {
        openCreateDialog(info.dateStr)
        return
    }

    openDateDialog(info.dateStr)
}

function handleEventDidMount(info: { el: HTMLElement }) {
    info.el.style.pointerEvents = 'none'
}

function resetForm() {
    form.patientId = patientOptions.value[0]?.value ?? ''
    form.procedureName = ''
    form.startAt = ''
    form.endAt = ''
    form.priority = 'Medium'
    form.status = 'Planned'
    form.notes = ''
}

async function submitProcedure() {
    if (!form.patientId || !form.procedureName.trim() || !form.startAt || submitting.value) return

    submitting.value = true

    try {
        await $fetch('/api/nurse/procedures', {
            method: editingProcedureId.value ? 'PUT' : 'POST',
            body: editingProcedureId.value
                ? {
                    id: editingProcedureId.value,
                    patient_id: form.patientId,
                    procedure_name: form.procedureName,
                    scheduled_at: new Date(form.startAt).toISOString(),
                    ended_at: form.endAt ? new Date(form.endAt).toISOString() : null,
                    priority: form.priority,
                    status: form.status,
                    notes: form.notes,
                }
                : {
                    patient_id: form.patientId,
                    procedure_name: form.procedureName,
                    scheduled_at: new Date(form.startAt).toISOString(),
                    ended_at: form.endAt ? new Date(form.endAt).toISOString() : null,
                    priority: form.priority,
                    status: form.status,
                    notes: form.notes,
                },
        })

        dialog.value = false
        editingProcedureId.value = null
        resetForm()
        await refresh()
    } finally {
        submitting.value = false
    }
}

async function deleteSelectedProcedure() {
    if (!selectedProcedure.value || submitting.value) return

    submitting.value = true

    try {
        await $fetch('/api/nurse/procedures', {
            method: 'DELETE',
            body: { id: selectedProcedure.value.id },
        })

        deleteDialog.value = false
        selectedProcedure.value = null
        await refresh()
    } finally {
        submitting.value = false
    }
}

function openDayCreate() {
    dialog.value = false
    openCreateDialog(selectedDateTime.value ?? (selectedDateKey.value ? `${selectedDateKey.value}T09:00:00` : undefined))
}

function formatListDate(dateInput: string) {
    return new Date(dateInput).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })
}

function formatRange(startValue: string, endValue: string | null) {
    const startLabel = new Date(startValue).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })

    if (!endValue) return startLabel

    const endLabel = new Date(endValue).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    })

    return `${startLabel} - ${endLabel}`
}

function toDateKey(value: string | Date) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

function toDatetimeLocal(value: string) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day}T${hours}:${minutes}`
}

function formatFriendlyDate(value: string) {
    const [year, month, day] = value.split('-').map(Number)
    const date = new Date(year, month - 1, day)

    return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

function getPriorityColor(priority: NurseProcedure['priority']) {
    if (priority === 'High') return '#ef4444'
    if (priority === 'Medium') return '#f59e0b'
    return '#22c55e'
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex flex-wrap align-center justify-space-between ga-3">
            <div>
                <div class="text-caption text-uppercase text-medium-emphasis">Nurse Care</div>
                <v-card-title class="text-h4">Procedure Schedule</v-card-title>
                <v-card-subtitle class="mt-1">Manage scheduled procedures by calendar or table.</v-card-subtitle>
            </div>
            <v-btn v-if="can('procedures.create')" color="primary" variant="flat" size="large" prepend-icon="mdi-plus"
                density="comfortable" @click="openCreateDialog()">
                Create Procedure
            </v-btn>
        </div>
    </v-card-item>
    <v-card elevation="0">
        <v-card-text class="d-flex flex-column ga-4">
            <v-tabs v-model="viewTab" color="primary" density="comfortable" class="procedure-tabs justify-end" grow>
                <v-tab value="calendar">Calendar</v-tab>
                <v-tab value="list">List</v-tab>
            </v-tabs>
            <div class="d-flex flex-wrap align-center ga-3">
                <v-text-field v-model="search" density="comfortable" hide-details clearable label="Search history"
                    placeholder="Patient, procedure, note..." prepend-inner-icon="mdi-magnify" variant="outlined"
                    class="procedure-filter-field" />
                <v-autocomplete v-model="categoryFilter" :items="categoryOptions" item-title="title" item-value="value"
                    label="Filter by status" variant="outlined" density="comfortable" hide-details clearable
                    class="procedure-filter-field" />
                <v-select v-model="statusFilter" :items="priorityOptions" item-title="title" item-value="value"
                    label="Filter by priority" variant="outlined" density="comfortable" hide-details clearable
                    class="procedure-filter-field procedure-filter-priority" />
            </div>
            <v-window v-model="viewTab">
                <v-window-item value="calendar">
                    <div class="calendar-shell">
                        <div class="calendar-toolbar">
                            <div class="calendar-nav-group">
                                <v-btn icon="mdi-chevron-left" variant="flat" color="primary" class="calendar-nav-btn"
                                    @click="calendarRef?.getApi?.().prev()" />
                                <v-btn icon="mdi-chevron-right" variant="flat" color="primary" class="calendar-nav-btn"
                                    @click="calendarRef?.getApi?.().next()" />
                                <v-btn variant="tonal" color="secondary" class="calendar-today-btn"
                                    @click="calendarRef?.getApi?.().today()">
                                    Today
                                </v-btn>
                            </div>

                            <div class="calendar-title">
                                {{ calendarTitle }}
                            </div>

                            <div class="calendar-toolbar-end">
                                <v-btn-toggle v-model="calendarView" color="primary" variant="outlined" divided
                                    density="comfortable">
                                    <v-btn value="dayGridMonth">Month</v-btn>
                                    <v-btn value="timeGridWeek">Week</v-btn>
                                    <v-btn value="timeGridDay">Day</v-btn>
                                </v-btn-toggle>
                            </div>
                        </div>

                        <FullCalendar ref="calendarRef" :options="calendarOptions">
                            <template #eventContent="arg">
                                <div class="calendar-event">
                                    <div class="calendar-event-main">
                                        <div class="calendar-event-title">
                                            {{ arg.event.extendedProps.patientName }}
                                        </div>
                                        <div class="calendar-event-subtitle">
                                            {{ arg.event.extendedProps.procedureName }}
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </FullCalendar>
                    </div>
                </v-window-item>

                <v-window-item value="list">
                    <v-table hover density="comfortable">
                        <thead class="bg-containerBg">
                            <tr>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Patient</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Procedure</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Schedule</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Priority</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Status</th>
                                <th class="text-right text-caption font-weight-bold text-uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="pending">
                                <td colspan="6" class="text-center py-8">
                                    <v-progress-circular indeterminate color="primary" />
                                </td>
                            </tr>
                            <tr v-else-if="filteredProcedures.length === 0">
                                <td colspan="6" class="text-center py-8 text-medium-emphasis">
                                    No procedures scheduled yet
                                </td>
                            </tr>
                            <tr v-else v-for="procedure in paginatedProcedures" :key="procedure.id">
                                <td class="py-3">
                                    <div class="text-body-2 font-weight-medium">{{ procedure.patient_name }}</div>
                                    <div class="text-caption text-medium-emphasis">{{ procedure.medical_record_number }}
                                    </div>
                                </td>
                                <td class="py-3">
                                    <div class="text-body-2">{{ procedure.procedure_name }}</div>
                                    <div class="text-caption text-medium-emphasis">{{ procedure.notes || '-' }}</div>
                                </td>
                                <td class="py-3 text-body-2 text-medium-emphasis">{{ formatRange(procedure.scheduled_at,
                                    procedure.ended_at) }}</td>
                                <td class="py-3">
                                    <v-chip size="small" variant="tonal"
                                        :color="procedure.priority === 'High' ? 'error' : procedure.priority === 'Medium' ? 'warning' : 'success'">
                                        {{ procedure.priority }}
                                    </v-chip>
                                </td>
                                <td class="py-3">
                                    <v-chip size="small" variant="tonal" color="primary">
                                        {{ procedure.status }}
                                    </v-chip>
                                </td>
                                <td class="py-3 text-right">
                                    <v-btn icon="mdi-pencil-outline" variant="text" size="small" color="secondary"
                                        @click="openEditDialog(procedure)" />
                                    <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error"
                                        @click="askDelete(procedure)" />
                                </td>
                            </tr>
                        </tbody>
                    </v-table>

                    <div v-if="filteredProcedures.length > itemsPerPage" class="d-flex justify-end">
                        <v-pagination 
                            v-model="currentPage" 
                            :length="totalPages" 
                            :total-visible="6"
                            rounded="circle" 
                        />
                    </div>
                </v-window-item>
            </v-window>
        </v-card-text>
    </v-card>

    <v-dialog v-model="dateDialog" max-width="760">
        <v-card>
            <v-card-title class="text-h6 d-flex align-center justify-space-between">
                <span>Procedures on {{ selectedDateLabel }}</span>
                <v-btn color="primary" variant="tonal" prepend-icon="mdi-plus" @click="openDayCreate">
                    Add
                </v-btn>
            </v-card-title>
            <v-card-text class="d-flex flex-column ga-3">
                <v-card v-for="procedure in selectedProcedures" :key="procedure.id" variant="flat" rounded="lg"
                    class="procedure-day-card">
                    <v-card-text class="pa-4">
                        <div class="d-flex align-start justify-space-between ga-4">
                            <div>
                                <div class="text-body-1 font-weight-semibold">{{ procedure.patient_name }}</div>
                                <div class="text-caption text-medium-emphasis">{{ procedure.procedure_name }}</div>
                            </div>
                            <v-chip size="small" variant="tonal" color="primary">
                                {{ procedure.status }}
                            </v-chip>
                        </div>

                        <div class="d-flex flex-wrap ga-2 mt-3">
                            <v-chip size="x-small" variant="tonal"
                                :color="procedure.priority === 'High' ? 'error' : procedure.priority === 'Medium' ? 'warning' : 'success'">
                                {{ procedure.priority }}
                            </v-chip>
                            <div class="text-caption text-medium-emphasis">
                                {{ formatRange(procedure.scheduled_at, procedure.ended_at) }}
                            </div>
                        </div>

                        <div class="procedure-detail-grid mt-3">
                            <div>
                                <div class="procedure-detail-label">MRN</div>
                                <div class="procedure-detail-value">{{ procedure.medical_record_number }}</div>
                            </div>
                            <div>
                                <div class="procedure-detail-label">Time</div>
                                <div class="procedure-detail-value">{{ formatRange(procedure.scheduled_at,
                                    procedure.ended_at) }}</div>
                            </div>
                            <div>
                                <div class="procedure-detail-label">Recorder</div>
                                <div class="procedure-detail-value">{{ procedure.recorded_by_name ?? 'Nurse' }}</div>
                            </div>
                            <div>
                                <div class="procedure-detail-label">Notes</div>
                                <div class="procedure-detail-value">{{ procedure.notes || 'No notes provided.' }}</div>
                            </div>
                        </div>

                        <div class="d-flex justify-end ga-2 mt-3">
                            <v-btn v-if="can('procedures.edit')" size="small" variant="text" color="secondary"
                                prepend-icon="mdi-pencil-outline" @click="openEditDialog(procedure)">
                                Edit
                            </v-btn>
                            <v-btn v-if="can('procedures.delete')" size="small" variant="text" color="error"
                                prepend-icon="mdi-delete-outline" @click="askDelete(procedure)">
                                Delete
                            </v-btn>
                        </div>
                    </v-card-text>
                </v-card>

                <div v-if="selectedProcedures.length === 0" class="text-center py-6 text-medium-emphasis">
                    No procedures on this day
                </div>
            </v-card-text>
            <v-card-actions class="justify-end">
                <v-btn variant="text" @click="dateDialog = false">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="dialog" max-width="780">
        <v-card>
            <v-card-title class="text-h6">
                {{ editingProcedureId ? 'Edit Procedure' : 'Create Procedure' }}
            </v-card-title>
            <v-card-text>
                <v-form class="d-flex flex-column ga-4" @submit.prevent="submitProcedure">
                    <div class="d-flex ga-2">
                        <v-autocomplete v-model="form.patientId" label="Patient" :items="patientOptions"
                            :loading="patientPending" item-title="title" item-value="value"
                            placeholder="Search patient..." variant="outlined" density="compact" hide-details clearable
                            class="flex-grow-1" />

                        <v-btn color="primary" variant="tonal" prepend-icon="mdi-account-plus" density="comfortable"
                            :disabled="patientPending" height="40" @click="openCreatePatient">
                            Create Patient
                        </v-btn>
                    </div>
                    <v-text-field v-model="form.procedureName" label="Procedure" placeholder="Wound dressing change"
                        variant="outlined" density="comfortable" />
                    <v-row dense>
                        <v-col cols="12" md="6">
                            <v-text-field v-model="form.startAt" label="Start time" type="datetime-local"
                                variant="outlined" density="comfortable" />
                        </v-col>
                        <v-col cols="12" md="6">
                            <v-text-field v-model="form.endAt" label="End time" type="datetime-local" variant="outlined"
                                density="comfortable" />
                        </v-col>
                    </v-row>
                    <v-row dense>
                        <v-col cols="12" md="6">
                            <v-select v-model="form.priority" :items="['Low', 'Medium', 'High']" label="Priority"
                                variant="outlined" density="comfortable" />
                        </v-col>
                        <v-col cols="12" md="6">
                            <v-select v-model="form.status" :items="['Planned', 'In Progress', 'Completed']"
                                label="Status" variant="outlined" density="comfortable" />
                        </v-col>
                    </v-row>
                    <v-textarea v-model="form.notes" label="Notes" rows="4" variant="outlined" density="comfortable" />
                    <div class="d-flex ga-2 justify-end">
                        <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
                        <v-btn type="submit" color="primary" variant="flat" :loading="submitting">
                            {{ editingProcedureId ? 'Update' : 'Save' }}
                        </v-btn>
                    </div>
                </v-form>
            </v-card-text>
        </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="420">
        <v-card>
            <v-card-title class="text-h6">Delete procedure?</v-card-title>
            <v-card-text>This record will be removed permanently.</v-card-text>
            <v-card-actions class="justify-end">
                <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
                <v-btn color="error" variant="flat" :loading="submitting"
                    @click="deleteSelectedProcedure">Delete</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <CreatePatientDialog v-model="dialogCreatePatient" @created="onCreatedPatient"
        @cancel="dialogCreatePatient = false" />
</template>

<style scoped>
.procedure-filter-field {
    min-width: 220px;
    flex: 1 1 240px;
}

.procedure-filter-priority {
    max-width: 260px;
}

.procedure-tabs {
    max-width: 420px;
}

.calendar-shell {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.calendar-toolbar {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 1rem;
    align-items: center;
}

.calendar-nav-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.calendar-nav-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
}

.calendar-today-btn {
    height: 40px;
    border-radius: 12px;
    text-transform: none;
}

.calendar-title {
    text-align: center;
    font-size: 1.35rem;
    font-weight: 700;
    color: rgb(var(--v-theme-on-surface));
}

.calendar-toolbar-end {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 1rem;
    flex-wrap: wrap;
}

.calendar-toolbar-note {
    text-align: right;
    max-width: 360px;
}

.procedure-detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem 1rem;
}

.procedure-detail-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(var(--v-theme-on-surface), 0.65);
    margin-bottom: 0.15rem;
}

.procedure-detail-value {
    font-size: 0.9rem;
    line-height: 1.45;
    color: rgb(var(--v-theme-on-surface));
    word-break: break-word;
}

@media (max-width: 700px) {
    .procedure-detail-grid {
        grid-template-columns: 1fr;
    }
}

.calendar-shell :deep(.fc) {
    --fc-border-color: rgba(0, 0, 0, 0.12);
    --fc-neutral-bg-color: rgb(var(--v-theme-surface));
    --fc-page-bg-color: transparent;
    --fc-today-bg-color: rgba(var(--v-theme-primary), 0.08);
    --fc-event-text-color: #fff;
}

.calendar-shell :deep(.fc .fc-toolbar) {
    display: none;
}

.calendar-shell :deep(.fc .fc-daygrid-event),
.calendar-shell :deep(.fc .fc-timegrid-event) {
    border-radius: 8px;
    padding: 2px 4px;
    cursor: pointer;
}

.calendar-shell :deep(.fc .fc-daygrid-event-harness),
.calendar-shell :deep(.fc .fc-timegrid-event-harness),
.calendar-shell :deep(.fc .fc-timegrid-event-harness-inset),
.calendar-shell :deep(.fc .fc-event) {
    pointer-events: none;
}

.calendar-shell :deep(.fc .fc-daygrid-day-frame),
.calendar-shell :deep(.fc .fc-timegrid-slot),
.calendar-shell :deep(.fc .fc-col-header-cell-cushion) {
    cursor: pointer;
}

.calendar-event {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
    position: relative;
}

.calendar-event-title {
    font-size: 0.72rem;
    font-weight: 600;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.calendar-event-main {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.calendar-event-subtitle {
    font-size: 0.65rem;
    line-height: 1.2;
    opacity: 0.9;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.procedure-day-card {
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: none;
}
</style>
