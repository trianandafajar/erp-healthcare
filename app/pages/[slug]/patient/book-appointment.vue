<script setup lang="ts">
definePageMeta({
    layout: 'patient',
    middleware: ['authorize'],
    permissions: ['book-appt.view'],
})

const { can } = usePermission()

useSeoMeta({
    title: 'Book Appointment',
    description: 'Patient appointment booking page',
})

type AppointmentStatus = 'waiting' | 'in_progress' | 'done' | 'cancelled'

interface PatientAppointment {
    id: string
    doctorId: string
    departmentId: string
    department: string
    doctor: string
    specialty: string
    date: string
    time: string
    complaint: string
    notes: string
    status: AppointmentStatus
}

type DbSchedule = {
    id: string
    day: string
    time: string
    doctorId: string
    doctorName: string
    specialty: string
    departmentId: string | null
    departmentName: string
}

const appointments = useState<PatientAppointment[]>('patient-book-appointments', () => [])
const schedules = ref<DbSchedule[]>([])

const search = ref('')
const statusFilter = ref<'all' | AppointmentStatus>('all')
const dialog = ref(false)
const deleteDialog = ref(false)
const editingId = ref<string | null>(null)
const deletingAppointment = ref<PatientAppointment | null>(null)
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')
const loadingAppointments = ref(false)
const savingAppointment = ref(false)
const deletingAppointmentLoading = ref(false)
const syncingFormState = ref(false)

function showSnackbar(msg: string, color = 'success') {
    snackbarMessage.value = msg
    snackbarColor.value = color
    snackbar.value = true
}

const emptyForm = () => ({
    departmentId: '',
    doctorId: '',
    date: '',
    time: '',
    complaint: '',
    notes: '',
    status: 'waiting' as AppointmentStatus,
})

const form = ref(emptyForm())

const departmentOptions = computed(() =>
    [...new Map(schedules.value.map((s) => [s.departmentId ?? '', s.departmentName])).entries()]
        .filter(([id]) => id)
        .map(([id, name]) => ({ id, name }))
)

const departmentNameById = computed(() =>
    new Map(departmentOptions.value.map((item) => [item.id, item.name]))
)

const doctorOptions = computed(() => {
    if (!form.value.departmentId) return []
    return schedules.value
        .filter((s) => s.departmentId === form.value.departmentId)
        .map((s) => ({ doctorId: s.doctorId, doctorName: s.doctorName, specialty: s.specialty }))
        .filter((value, index, arr) => arr.findIndex((entry) => entry.doctorId === value.doctorId) === index)
})

const filteredAppointments = computed(() =>
    appointments.value.filter((item) => {
        const keyword = search.value.toLowerCase()
        const matchesSearch =
            item.doctor.toLowerCase().includes(keyword) ||
            item.department.toLowerCase().includes(keyword) ||
            item.specialty.toLowerCase().includes(keyword) ||
            item.complaint.toLowerCase().includes(keyword) ||
            item.id.toLowerCase().includes(keyword)
        const matchesStatus = statusFilter.value === 'all' || item.status === statusFilter.value
        return matchesSearch && matchesStatus
    })
)

const selectedSchedule = computed(() =>
    schedules.value.find((s) => s.doctorId === form.value.doctorId && s.departmentId === form.value.departmentId) ??
    schedules.value.find((s) => s.doctorId === form.value.doctorId) ??
    null
)

const isSaveDisabled = computed(() =>
    savingAppointment.value ||
    !form.value.doctorId ||
    !form.value.departmentId ||
    !form.value.date ||
    !form.value.complaint
)

function normalizeStatus(status?: string | null): AppointmentStatus {
    if (status === 'in_progress') return 'in_progress'
    if (status === 'done') return 'done'
    if (status === 'cancelled' || status === 'Cancelled') return 'cancelled'
    return 'waiting'
}

function getScheduleStartTime(schedule: DbSchedule) {
    return schedule.time.split(' - ')[0] ?? schedule.time
}

watch(() => form.value.departmentId, (nextDepartmentId, previousDepartmentId) => {
    if (syncingFormState.value) return
    if (nextDepartmentId === previousDepartmentId) return
    form.value.doctorId = ''
    form.value.time = ''
})

watch(() => form.value.doctorId, () => {
    form.value.time = selectedSchedule.value?.time ?? ''
})

function openCreate() {
    editingId.value = null
    syncingFormState.value = true
    form.value = emptyForm()
    nextTick(() => {
        syncingFormState.value = false
    })
    dialog.value = true
}

function openEdit(item: PatientAppointment) {
    editingId.value = item.id
    syncingFormState.value = true
    form.value = {
        departmentId: item.departmentId,
        doctorId: item.doctorId,
        date: item.date,
        time: item.time,
        complaint: item.complaint,
        notes: item.notes,
        status: item.status === 'done' || item.status === 'in_progress' ? 'waiting' : item.status,
    }
    nextTick(() => {
        syncingFormState.value = false
    })
    dialog.value = true
}

async function loadAppointments() {
    loadingAppointments.value = true
    try {
        const data = await $fetch<any>('/api/patient/appointments/today')
        const apiAppointments = data?.appointments ?? []
        appointments.value = apiAppointments.map((item: any) => ({
            id: item.id ?? '',
            doctorId: item.doctor_id ?? '',
            departmentId: item.department_id ?? '',
            department: departmentNameById.value.get(item.department_id ?? '') ?? item.department_id ?? '',
            doctor: item.doctors?.profiles?.full_name ?? '',
            specialty: item.doctors?.specialization ?? '',
            date: item.appointment_date ?? '',
            time: item.appointment_time ?? '',
            complaint: item.chief_complaint ?? '',
            notes: item.notes ?? '',
            status: normalizeStatus(item.status),
        }))
    } catch (e: any) {
        showSnackbar(e?.data?.message ?? 'Failed to load appointments.', 'error')
    } finally {
        loadingAppointments.value = false
    }
}

async function loadSchedules() {
    try {
        const data = await $fetch<any>('/api/patient/schedules')
        schedules.value = (data?.schedules ?? []) as DbSchedule[]
    } catch (e: any) {
        showSnackbar(e?.data?.message ?? 'Failed to load schedules.', 'error')
    }
}

async function saveAppointment() {
    if (isSaveDisabled.value) return

    const schedule = selectedSchedule.value
    if (!schedule) {
        showSnackbar('Doctor schedule is required.', 'error')
        return
    }

    const payload = {
        doctor_id: form.value.doctorId,
        department_id: form.value.departmentId,
        appointment_date: form.value.date,
        appointment_time: getScheduleStartTime(schedule),
        type: 'appointment',
        status: form.value.status,
        chief_complaint: form.value.complaint,
        notes: form.value.notes || form.value.complaint,
    }

    savingAppointment.value = true
    try {
        if (editingId.value) {
            await $fetch(`/api/patient/appointments/${editingId.value}`, {
                method: 'PATCH',
                body: payload,
            })
            showSnackbar('Appointment has been updated.', 'success')
        } else {
            await $fetch('/api/patient/appointments/today', {
                method: 'POST',
                body: payload,
            })
            showSnackbar('Appointment has been booked.', 'success')
        }

        await loadAppointments()
        dialog.value = false
        editingId.value = null
        form.value = emptyForm()
    } catch (e: any) {
        showSnackbar(e?.data?.message ?? 'Failed to save appointment.', 'error')
    } finally {
        savingAppointment.value = false
    }
}

function openDelete(item: PatientAppointment) {
    deletingAppointment.value = item
    deleteDialog.value = true
}

async function deleteAppointment() {
    if (!deletingAppointment.value) return

    deletingAppointmentLoading.value = true
    try {
        await $fetch(`/api/patient/appointments/${deletingAppointment.value.id}`, {
            method: 'DELETE',
        })
        await loadAppointments()
        showSnackbar('Appointment has been deleted.', 'success')
        deleteDialog.value = false
        deletingAppointment.value = null
    } catch (e: any) {
        showSnackbar(e?.data?.message ?? 'Failed to delete appointment.', 'error')
    } finally {
        deletingAppointmentLoading.value = false
    }
}

function formatDate(dateStr: string) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

function statusColor(status: AppointmentStatus) {
    if (status === 'waiting') return 'primary'
    if (status === 'in_progress') return 'info'
    if (status === 'done') return 'success'
    return 'error'
}

await loadSchedules()
await loadAppointments()
</script>

<template>
    <div class="d-flex justify-space-between align-center mb-6 flex-wrap ga-3">
        <div>
            <h2 class="text-h3 mb-1">Book Appointment</h2>
            <p class="text-medium-emphasis mb-0">Manage your appointment requests and preferred doctor schedules.</p>
        </div>
        <v-btn v-if="can('book-appt.create')" color="primary" prepend-icon="mdi-calendar-plus" @click="openCreate">
            Book Appointment
        </v-btn>
    </div>

    <UiTitleCard class-name="px-0 pb-0 rounded-md" title="Appointment Requests">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 px-4 py-3">
            <v-text-field v-model="search" placeholder="Search appointment, doctor, department, or complaint"
                prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable
                style="max-width: 430px" />

            <v-btn-toggle v-model="statusFilter" mandatory density="compact" variant="tonal" color="primary">
                <v-btn value="all">All</v-btn>
                <v-btn value="waiting">Waiting</v-btn>
                <v-btn value="in_progress">In Progress</v-btn>
                <v-btn value="done">Done</v-btn>
                <v-btn value="cancelled">Cancelled</v-btn>
            </v-btn-toggle>
        </div>

        <v-table class="text-no-wrap">
            <thead>
                <tr>
                    <th class="text-no-wrap">Appointment ID</th>
                    <th class="text-no-wrap">Date</th>
                    <th class="text-no-wrap">Doctor</th>
                    <th class="text-no-wrap">Department</th>
                    <th class="text-no-wrap">Practice Time</th>
                    <th class="text-no-wrap">Complaint</th>
                    <th class="text-no-wrap">Status</th>
                    <th class="text-no-wrap text-right">Action</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="loadingAppointments">
                    <td colspan="8" class="text-center py-6">
                        <v-progress-circular indeterminate color="primary" />
                    </td>
                </tr>
                <template v-else>
                    <tr v-for="item in filteredAppointments" :key="item.id">
                        <td>{{ item.id }}</td>
                        <td>{{ formatDate(item.date) }}</td>
                        <td>
                            <div class="font-weight-medium">{{ item.doctor }}</div>
                            <div class="text-caption text-medium-emphasis">{{ item.specialty }}</div>
                        </td>
                        <td>{{ item.department }}</td>
                        <td>{{ item.time }}</td>
                        <td class="text-wrap">{{ item.complaint }}</td>
                        <td>
                            <v-chip size="small" :color="statusColor(item.status)" variant="tonal">
                                {{ item.status }}
                            </v-chip>
                        </td>
                        <td class="text-right">
                            <div class="d-flex justify-end ga-2">
                                <v-tooltip text="Edit appointment">
                                    <template #activator="{ props }">
                                        <v-btn v-if="can('book-appt.edit')" v-bind="props" icon="mdi-pencil-outline"
                                            size="small" color="primary" variant="tonal" aria-label="Edit appointment"
                                            @click="openEdit(item)" />
                                    </template>
                                </v-tooltip>
                                <v-tooltip text="Delete appointment">
                                    <template #activator="{ props }">
                                        <v-btn v-if="can('book-appt.delete')" v-bind="props" icon="mdi-delete-outline"
                                            size="small" color="error" variant="tonal" aria-label="Delete appointment"
                                            @click="openDelete(item)" />
                                    </template>
                                </v-tooltip>
                            </div>
                        </td>
                    </tr>
                    <tr v-if="filteredAppointments.length === 0">
                        <td colspan="8" class="text-center py-6 text-medium-emphasis">No appointment found.</td>
                    </tr>
                </template>
            </tbody>
        </v-table>
    </UiTitleCard>

    <v-dialog v-model="dialog" max-width="760">
        <v-card rounded="lg">
            <v-card-item>
                <v-card-title class="px-0">
                    {{ editingId ? 'Edit Appointment' : 'Book Appointment' }}
                </v-card-title>
                <v-card-subtitle class="px-0 mt-1">
                    Select an available doctor schedule and submit your visit request.
                </v-card-subtitle>
            </v-card-item>

            <v-card-text>
                <v-row>
                    <v-col cols="12" md="6">
                        <v-select v-model="form.departmentId" :items="departmentOptions" label="Department"
                            item-title="name" item-value="id" variant="outlined" hide-details />
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-select v-model="form.doctorId" :items="doctorOptions" label="Doctor" item-title="doctorName"
                            item-value="doctorId" variant="outlined" hide-details />
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.date" label="Preferred Date" type="date" variant="outlined"
                            hide-details />
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.time" label="Practice Time" variant="outlined" readonly
                            hide-details />
                        <div v-if="selectedSchedule" class="text-caption text-medium-emphasis mt-2">
                            Available every {{ selectedSchedule.day }}, {{ selectedSchedule.time }}.
                        </div>
                    </v-col>

                    <v-col v-if="editingId" cols="12" md="6">
                        <v-select v-model="form.status" :items="[
                            { title: 'Waiting', value: 'waiting' },
                            { title: 'Cancelled', value: 'cancelled' }
                        ]" label="Status" item-title="title" item-value="value" variant="outlined" hide-details />
                    </v-col>
                    <v-col cols="12">
                        <v-textarea v-model="form.complaint" label="Complaint or Notes" variant="outlined" rows="4"
                            hide-details />
                    </v-col>
                    <v-col cols="12">
                        <v-textarea v-model="form.notes" label="Additional Notes" variant="outlined" rows="3"
                            hide-details />
                    </v-col>
                </v-row>
            </v-card-text>

            <v-card-actions class="px-6 pb-4">
                <v-spacer />
                <v-btn variant="text" :disabled="savingAppointment" @click="dialog = false">Cancel</v-btn>
                <v-btn color="primary" variant="flat" prepend-icon="mdi-content-save-outline"
                    :loading="savingAppointment" :disabled="isSaveDisabled"
                    :style="isSaveDisabled ? 'cursor: not-allowed; pointer-events: auto;' : ''"
                    @click="saveAppointment">
                    {{ editingId ? 'Save Changes' : 'Save Appointment' }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="460">
        <v-card rounded="lg">
            <v-card-title>Delete Appointment</v-card-title>
            <v-card-text>
                Are you sure you want to delete appointment
                <span class="font-weight-medium">{{ deletingAppointment?.id }}</span>?
            </v-card-text>
            <v-card-actions class="px-6 pb-4">
                <v-spacer />
                <v-btn variant="text" :disabled="deletingAppointmentLoading" @click="deleteDialog = false">Cancel</v-btn>
                <v-btn color="error" variant="flat" :loading="deletingAppointmentLoading"
                    :disabled="deletingAppointmentLoading"
                    :style="deletingAppointmentLoading ? 'cursor: wait; pointer-events: auto;' : ''"
                    @click="deleteAppointment">
                    Delete
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" timeout="3000">
        {{ snackbarMessage }}
        <template #actions>
            <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
        </template>
    </v-snackbar>
</template>
