<script setup lang="ts">
const workspace = useReceptionistWorkspace()
const search = ref('')
const statusFilter = ref('All')
const dialog = ref(false)
const snackbar = ref(false)
const snackbarMessage = ref('')
const formError = ref('')

const form = reactive({
    patientId: '',
    doctorScheduleId: '',
    appointmentDate: '2026-06-17',
    appointmentTime: '',
    type: 'Consultation',
    note: '',
})

const patientOptions = computed(() => workspace.patients.value.map((item) => ({
    title: `${item.fullName} (${item.medicalRecordNumber})`,
    value: item.id,
})))

const doctorScheduleOptions = computed(() => workspace.doctorSchedules.value.map((item) => ({
    title: `${item.doctorName} - ${item.department}`,
    value: item.id,
    props: {
        subtitle: `${item.day}, ${item.startTime} - ${item.endTime} | ${item.room} | ${item.status}`,
        disabled: item.status === 'Off Duty' || item.status === 'Full',
    },
})))

const selectedSchedule = computed(() => workspace.doctorSchedules.value.find((item) => item.id === form.doctorScheduleId) ?? null)

const scheduleTimeHint = computed(() => {
    if (!selectedSchedule.value) return 'Select a doctor schedule to see available appointment time.'
    return `Available time: ${selectedSchedule.value.startTime} - ${selectedSchedule.value.endTime} (${selectedSchedule.value.day}, ${selectedSchedule.value.room}).`
})

const filteredAppointments = computed(() => {
    const keyword = search.value.toLowerCase()
    return workspace.appointments.value.filter((item) => {
        const matchesStatus = statusFilter.value === 'All' || item.status === statusFilter.value
        const matchesKeyword =
            item.patientName.toLowerCase().includes(keyword) ||
            item.medicalRecordNumber.toLowerCase().includes(keyword) ||
            item.doctorName.toLowerCase().includes(keyword) ||
            item.department.toLowerCase().includes(keyword)

        return matchesStatus && matchesKeyword
    })
})

function statusColor(status: string) {
    if (status === 'Completed') return 'success'
    if (status === 'Cancelled') return 'error'
    if (status === 'Checked In' || status === 'Waiting') return 'primary'
    return 'secondary'
}

watch(
    () => form.doctorScheduleId,
    () => {
        formError.value = ''
        if (!selectedSchedule.value) {
            form.appointmentTime = ''
            return
        }

        if (
            !form.appointmentTime ||
            form.appointmentTime < selectedSchedule.value.startTime ||
            form.appointmentTime > selectedSchedule.value.endTime
        ) {
            form.appointmentTime = selectedSchedule.value.startTime
        }
    }
)

function createAppointment() {
    const patient = workspace.patients.value.find((item) => item.id === form.patientId)
    const schedule = selectedSchedule.value
    formError.value = ''

    if (!patient || !schedule || !form.appointmentTime) {
        formError.value = 'Patient, doctor schedule, and time are required.'
        return
    }

    if (form.appointmentTime < schedule.startTime || form.appointmentTime > schedule.endTime) {
        formError.value = `Time must be between ${schedule.startTime} and ${schedule.endTime}.`
        return
    }

    workspace.createAppointment({
        patientId: patient.id,
        patientName: patient.fullName,
        medicalRecordNumber: patient.medicalRecordNumber,
        doctorName: schedule.doctorName,
        department: schedule.department,
        appointmentDate: form.appointmentDate,
        appointmentTime: form.appointmentTime,
        type: form.type,
        note: form.note,
    })

    form.patientId = ''
    form.doctorScheduleId = ''
    form.appointmentTime = ''
    form.type = 'Consultation'
    form.note = ''
    dialog.value = false
    snackbarMessage.value = 'Appointment created successfully.'
    snackbar.value = true
}
</script>

<template>
    <div class="d-flex justify-space-between align-center mb-6 flex-wrap ga-3">
        <div>
            <h2 class="text-h3 mb-1">Appointment</h2>
            <p class="text-medium-emphasis mb-0">Manage patient visit schedules and appointment status.</p>
        </div>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="dialog = true">Create Appointment</v-btn>
    </div>

    <UiTitleCard class-name="px-0 pb-0 rounded-md" title="Appointment List">
        <div class="px-4 py-3 d-flex flex-wrap ga-3">
            <v-text-field
                v-model="search"
                placeholder="Search patient, doctor, MRN, or department"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                style="max-width: 420px"
            />
            <v-select
                v-model="statusFilter"
                :items="['All', 'Scheduled', 'Checked In', 'Waiting', 'Completed', 'Cancelled']"
                variant="outlined"
                density="compact"
                hide-details
                style="max-width: 220px"
            />
        </div>

        <v-table class="text-no-wrap">
            <thead>
                <tr>
                    <th>Patient</th>
                    <th>Schedule</th>
                    <th>Doctor</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th class="text-right">Action</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in filteredAppointments" :key="item.id">
                    <td>
                        <div class="font-weight-medium">{{ item.patientName }}</div>
                        <div class="text-caption text-medium-emphasis">{{ item.medicalRecordNumber }}</div>
                    </td>
                    <td>
                        <div>{{ item.appointmentDate }}</div>
                        <div class="text-caption text-medium-emphasis">{{ item.appointmentTime }}</div>
                    </td>
                    <td>
                        <div>{{ item.doctorName }}</div>
                        <div class="text-caption text-medium-emphasis">{{ item.department }}</div>
                    </td>
                    <td>{{ item.type }}</td>
                    <td>
                        <v-chip size="small" variant="tonal" :color="statusColor(item.status)">{{ item.status }}</v-chip>
                    </td>
                    <td class="text-right">
                        <v-btn
                            v-if="item.status === 'Scheduled'"
                            size="small"
                            color="primary"
                            variant="tonal"
                            @click="workspace.checkInAppointment(item.id)"
                        >
                            Check-in
                        </v-btn>
                        <v-btn
                            v-else-if="item.status !== 'Completed'"
                            size="small"
                            color="success"
                            variant="tonal"
                            @click="workspace.updateAppointmentStatus(item.id, 'Completed')"
                        >
                            Complete
                        </v-btn>
                    </td>
                </tr>
                <tr v-if="filteredAppointments.length === 0">
                    <td colspan="6" class="text-center py-6 text-medium-emphasis">No appointment found.</td>
                </tr>
            </tbody>
        </v-table>
    </UiTitleCard>

    <v-dialog v-model="dialog" max-width="720">
        <v-card>
            <v-card-title class="text-h5">Create Appointment</v-card-title>
            <v-divider />
            <v-card-text>
                <v-row>
                    <v-col cols="12">
                        <v-select v-model="form.patientId" :items="patientOptions" label="Patient" variant="outlined" density="compact" hide-details />
                    </v-col>
                    <v-col cols="12">
                        <v-select
                            v-model="form.doctorScheduleId"
                            :items="doctorScheduleOptions"
                            label="Doctor Schedule"
                            variant="outlined"
                            density="compact"
                            hide-details
                        />
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-text-field
                            :model-value="selectedSchedule?.department ?? ''"
                            label="Department"
                            variant="outlined"
                            density="compact"
                            hide-details
                            readonly
                        />
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-text-field v-model="form.appointmentDate" type="date" label="Date" variant="outlined" density="compact" hide-details />
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-text-field
                            v-model="form.appointmentTime"
                            type="time"
                            label="Time"
                            variant="outlined"
                            density="compact"
                            :min="selectedSchedule?.startTime"
                            :max="selectedSchedule?.endTime"
                            :hint="scheduleTimeHint"
                            persistent-hint
                            :disabled="!selectedSchedule"
                        />
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-select v-model="form.type" :items="['Consultation', 'New Visit', 'Control', 'Procedure']" label="Type" variant="outlined" density="compact" hide-details />
                    </v-col>
                    <v-col cols="12">
                        <v-textarea v-model="form.note" label="Note" variant="outlined" density="compact" rows="3" hide-details />
                    </v-col>
                    <v-col v-if="formError" cols="12">
                        <v-alert color="error" variant="tonal">{{ formError }}</v-alert>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-card-actions class="justify-end">
                <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
                <v-btn color="primary" variant="flat" @click="createAppointment">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" color="success" timeout="2500">{{ snackbarMessage }}</v-snackbar>
</template>
