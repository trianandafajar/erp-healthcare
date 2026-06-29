<script setup lang="ts">
definePageMeta({
    layout: 'patient',
    middleware: ['auth', 'permission'],
    permissions: ['book-appt.view'],
})

const { can } = usePermission()

useSeoMeta({
    title: 'Book Appointment',
    description: 'Patient appointment booking page',
})

type AppointmentStatus = 'waiting' | 'Cancelled'

interface PatientAppointment {
    id: string
    department: string
    doctor: string
    specialty: string
    date: string
    time: string
    complaint: string
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

// state
const { visits } = usePatientPortalMock()

const appointments = useState<PatientAppointment[]>('patient-book-appointments', () => [])
const schedules = ref<DbSchedule[]>([])

const search = ref('')
const statusFilter = ref<'All' | AppointmentStatus>('All')
const dialog = ref(false)
const deleteDialog = ref(false)
const editingId = ref<string | null>(null)
const deletingAppointment = ref<PatientAppointment | null>(null)
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

const isDisabled = computed(() =>
    !form.value.doctorId ||
    !form.value.departmentId ||
    !form.value.date ||
    !form.value.complaint
)

function showSnackbar(msg: string, color = 'success') {
    snackbarMessage.value = msg
    snackbarColor.value = color
    snackbar.value = true
}

const emptyForm = () => ({
    departmentId: '' as string,
    doctorId: '' as string,
    date: '',
    time: '',
    complaint: '',
    status: 'waiting' as AppointmentStatus
})

const form = ref(emptyForm())

// computed
const departmentOptions = computed(() =>
    [...new Map(schedules.value.map((s) => [s.departmentId ?? '', s.departmentName])).entries()]
        .filter(([id]) => id)
        .map(([id, name]) => ({ id, name }))
)

const doctorOptions = computed(() => {
    if (!form.value.departmentId) return []
    return schedules.value
        .filter((s) => s.departmentId === form.value.departmentId)
        .map((s) => ({ doctorId: s.doctorId, doctorName: s.doctorName, specialty: s.specialty }))
        .filter((v, i, arr) => arr.findIndex((x) => x.doctorId === v.doctorId) === i)
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
        const matchesStatus = statusFilter.value === 'All' || item.status === statusFilter.value
        return matchesSearch && matchesStatus
    })
)

const selectedSchedule = computed(() =>
    schedules.value.find((s) => s.doctorId === form.value.doctorId) ?? null
)

// watchers
watch(() => form.value.departmentId, () => {
    form.value.doctorId = ''
    form.value.time = ''
})

watch(() => form.value.doctorId, () => {
    form.value.time = selectedSchedule.value?.time ?? ''
})

// functions
function openCreate() {
    editingId.value = null
    form.value = emptyForm()
    dialog.value = true
}

function openEdit(item: PatientAppointment) {
    editingId.value = item.id
    dialog.value = true
}

async function loadAppointments() {
    const { data, error } = await useFetch('/api/patient/appointments/today', {
        method: 'GET',
    })
    if (error.value) return

    const apiAppointments = data.value?.appointments ?? []
    appointments.value = apiAppointments.map((item: any) => ({
        id: item.id ?? '',
        department: item.department ?? item.department_id ?? '',
        doctor: item.doctors?.profiles?.full_name ?? '',
        specialty: item.doctors?.specialization ?? '',
        date: item.appointment_date ?? '',
        time: item.appointment_time ?? '',
        complaint: item.chief_complaint ?? item.notes ?? '',
        status: item.status === 'Cancelled' ? 'Cancelled' : 'waiting',
    }))
}

async function loadSchedules() {
    const { data, error } = await useFetch('/api/patient/schedules', { method: 'GET' })
    if (error.value) return
    schedules.value = (data.value?.schedules ?? []) as DbSchedule[]
}

async function saveAppointment() {
    if (editingId.value) {
        showSnackbar(
            'Editing existing appointments is not implemented in this page.',
            'warning'
        )
        snackbar.value = true
        return
    }

    if (!form.value.doctorId || !form.value.departmentId || !form.value.date || !form.value.complaint) return

    const schedule = selectedSchedule.value
    if (!schedule) return

    const payload = {
        doctor_id: form.value.doctorId,
        department_id: form.value.departmentId,
        appointment_date: form.value.date,
        appointment_time: schedule.time.split(' - ')[0] ?? schedule.time,
        type: 'appointment',
        status: 'waiting',
        chief_complaint: form.value.complaint,
        notes: form.value.complaint,
    }

    const { error } = await useFetch('/api/patient/appointments/today', {
        method: 'POST',
        body: payload,
    })

    if ((error.value as any)?.message) {
        showSnackbar((error.value as any).message, 'error')
        return
    }

    showSnackbar('Appointment has been booked.', 'success')
    snackbar.value = true
    dialog.value = false
    form.value = emptyForm()
    await loadAppointments()
}

function openDelete(item: PatientAppointment) {
    deletingAppointment.value = item
    deleteDialog.value = true
}

function deleteAppointment() {
    if (!deletingAppointment.value) return
    appointments.value = appointments.value.filter((item) => item.id !== deletingAppointment.value?.id)
    showSnackbar('Appointment has been deleted.', 'success')
    snackbar.value = true
    deleteDialog.value = false
    deletingAppointment.value = null
}

function formatDate(dateStr: string) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
}

function statusColor(status: AppointmentStatus) {
    return status === 'waiting' ? 'primary' : 'error'
}

// init
await Promise.all([loadAppointments(), loadSchedules()])
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
                <v-btn value="All">All</v-btn>
                <v-btn value="Scheduled">Scheduled</v-btn>
                <v-btn value="Cancelled">Cancelled</v-btn>
            </v-btn-toggle>
        </div>

        <v-table class="text-no-wrap">
            <thead>
                <tr>
                    <th>Appointment ID</th>
                    <th>Date</th>
                    <th>Doctor</th>
                    <th>Department</th>
                    <th>Practice Time</th>
                    <th>Complaint</th>
                    <th>Status</th>
                    <th class="text-right">Action</th>
                </tr>
            </thead>
            <tbody>
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
                        <v-chip size="small" :color="statusColor(item.status)" variant="tonal">{{ item.status
                        }}</v-chip>
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
                        <v-select v-model="form.status" :items="['Scheduled', 'Cancelled']" label="Status"
                            variant="outlined" hide-details />
                    </v-col>
                    <v-col cols="12">
                        <v-textarea v-model="form.complaint" label="Complaint or Notes" variant="outlined" rows="4"
                            hide-details />
                    </v-col>
                </v-row>
            </v-card-text>

            <v-card-actions class="px-6 pb-4">
                <v-spacer />
                <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
                <v-btn color="primary" variant="flat" prepend-icon="mdi-content-save-outline"
                    :disabled="!form.doctorId || !form.departmentId || !form.date || !form.complaint"
                    :style="isDisabled ? 'cursor: not-allowed; pointer-events: auto;' : ''" @click="saveAppointment">
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
                <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
                <v-btn color="error" variant="flat" @click="deleteAppointment">Delete</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <!-- <v-snackbar v-model="snackbar" color="success">
        {{ snackbarMessage }}
    </v-snackbar> -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" timeout="3000">
        {{ snackbarMessage }}
        <template #actions>
            <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
        </template>
    </v-snackbar>
</template>
