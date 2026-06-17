<script setup lang="ts">
definePageMeta({
    layout: 'patient',
    middleware: 'auth'
})

useSeoMeta({
    title: 'Book Appointment',
    description: 'Patient appointment booking page',
})

type AppointmentStatus = 'Scheduled' | 'Cancelled'

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

const { doctorSchedules, visits } = usePatientPortalMock()

const initialAppointments = visits
    .filter((item) => item.status === 'Scheduled')
    .map((item) => ({
        id: item.id,
        department: item.department,
        doctor: item.doctor,
        specialty: doctorSchedules.find((schedule) => schedule.doctor === item.doctor)?.specialty ?? item.department,
        date: item.date,
        time: doctorSchedules.find((schedule) => schedule.doctor === item.doctor)?.time ?? '-',
        complaint: item.complaint,
        status: item.status as AppointmentStatus
    }))

const appointments = useState<PatientAppointment[]>('patient-book-appointments', () => initialAppointments)
const search = ref('')
const statusFilter = ref<'All' | AppointmentStatus>('All')
const dialog = ref(false)
const deleteDialog = ref(false)
const editingId = ref<string | null>(null)
const deletingAppointment = ref<PatientAppointment | null>(null)
const snackbar = ref(false)
const snackbarMessage = ref('')

const emptyForm = () => ({
    department: '',
    doctor: '',
    date: '',
    time: '',
    complaint: '',
    status: 'Scheduled' as AppointmentStatus
})

const form = ref(emptyForm())

const departmentOptions = computed(() => [...new Set(doctorSchedules.map((item) => item.department))])
const doctorOptions = computed(() =>
    doctorSchedules.filter((item) => !form.value.department || item.department === form.value.department)
)

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
    doctorSchedules.find((item) => item.doctor === form.value.doctor)
)

watch(() => form.value.department, () => {
    if (!doctorOptions.value.some((item) => item.doctor === form.value.doctor)) {
        form.value.doctor = ''
        form.value.time = ''
    }
})

watch(() => form.value.doctor, () => {
    form.value.time = selectedSchedule.value?.time ?? ''
})

function openCreate() {
    editingId.value = null
    form.value = emptyForm()
    dialog.value = true
}

function openEdit(item: PatientAppointment) {
    editingId.value = item.id
    form.value = {
        department: item.department,
        doctor: item.doctor,
        date: item.date,
        time: item.time,
        complaint: item.complaint,
        status: item.status
    }
    dialog.value = true
}

function saveAppointment() {
    const schedule = selectedSchedule.value
    const payload: PatientAppointment = {
        id: editingId.value ?? `APP-${Date.now().toString().slice(-6)}`,
        department: form.value.department,
        doctor: form.value.doctor,
        specialty: schedule?.specialty ?? form.value.department,
        date: form.value.date,
        time: form.value.time,
        complaint: form.value.complaint,
        status: form.value.status
    }

    if (editingId.value) {
        appointments.value = appointments.value.map((item) => (item.id === editingId.value ? payload : item))
        snackbarMessage.value = 'Appointment has been updated.'
    } else {
        appointments.value = [payload, ...appointments.value]
        snackbarMessage.value = 'Appointment has been booked.'
    }

    snackbar.value = true
    dialog.value = false
}

function openDelete(item: PatientAppointment) {
    deletingAppointment.value = item
    deleteDialog.value = true
}

function deleteAppointment() {
    if (!deletingAppointment.value) return

    appointments.value = appointments.value.filter((item) => item.id !== deletingAppointment.value?.id)
    snackbarMessage.value = 'Appointment has been deleted.'
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
    return status === 'Scheduled' ? 'primary' : 'error'
}
</script>

<template>
    <div class="d-flex justify-space-between align-center mb-6 flex-wrap ga-3">
        <div>
            <h2 class="text-h3 mb-1">Book Appointment</h2>
            <p class="text-medium-emphasis mb-0">Manage your appointment requests and preferred doctor schedules.</p>
        </div>
        <v-btn color="primary" prepend-icon="mdi-calendar-plus" @click="openCreate">
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
                        <v-chip size="small" :color="statusColor(item.status)" variant="tonal">{{ item.status }}</v-chip>
                    </td>
                    <td class="text-right">
                        <div class="d-flex justify-end ga-2">
                            <v-tooltip text="Edit appointment">
                                <template #activator="{ props }">
                                    <v-btn v-bind="props" icon="mdi-pencil-outline" size="small" color="primary"
                                        variant="tonal" aria-label="Edit appointment" @click="openEdit(item)" />
                                </template>
                            </v-tooltip>
                            <v-tooltip text="Delete appointment">
                                <template #activator="{ props }">
                                    <v-btn v-bind="props" icon="mdi-delete-outline" size="small" color="error"
                                        variant="tonal" aria-label="Delete appointment" @click="openDelete(item)" />
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
                        <v-select v-model="form.department" :items="departmentOptions" label="Department"
                            variant="outlined" hide-details />
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-select v-model="form.doctor" :items="doctorOptions.map((item) => item.doctor)" label="Doctor"
                            variant="outlined" hide-details />
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.date" label="Preferred Date" type="date" variant="outlined"
                            hide-details />
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.time" label="Practice Time" variant="outlined" readonly hide-details />
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
                    :disabled="!form.department || !form.doctor || !form.date || !form.complaint"
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
                <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
                <v-btn color="error" variant="flat" @click="deleteAppointment">Delete</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" color="success">
        {{ snackbarMessage }}
    </v-snackbar>
</template>
