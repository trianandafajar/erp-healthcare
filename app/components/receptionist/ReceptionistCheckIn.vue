<script setup lang="ts">
const workspace = useReceptionistWorkspace()
const search = ref('')
const generatedQueue = ref<ReturnType<typeof workspace.checkInAppointment>>(null)
const statusFilter = ref('Scheduled')
const doctorFilter = ref('All')
const appointmentDateFilter = ref('')
const confirmDialog = ref(false)
const queueDialog = ref(false)
const selectedAppointment = ref<(typeof workspace.appointments.value)[number] | null>(null)
const { can } = usePermission()

const scheduledAppointments = computed(() => {
    const keyword = search.value.toLowerCase()
    return workspace.appointments.value.filter((item) => {
        const matchesKeyword =
            item.patientName.toLowerCase().includes(keyword) ||
            item.medicalRecordNumber.toLowerCase().includes(keyword) ||
            item.doctorName.toLowerCase().includes(keyword) ||
            item.department.toLowerCase().includes(keyword) ||
            item.type.toLowerCase().includes(keyword) ||
            item.note.toLowerCase().includes(keyword)
        const matchesStatus = statusFilter.value === 'All' || item.status === statusFilter.value
        const matchesDoctor = doctorFilter.value === 'All' || item.doctorName === doctorFilter.value
        const matchesDate = !appointmentDateFilter.value || item.appointmentDate === appointmentDateFilter.value

        return (
            matchesKeyword &&
            matchesStatus &&
            matchesDoctor &&
            matchesDate
        )
    })
})

const statusOptions = computed(() => ['All', ...new Set(workspace.appointments.value.map((item) => item.status))])
const doctorOptions = computed(() => ['All', ...new Set(workspace.appointments.value.map((item) => item.doctorName))])

function resetFilters() {
    search.value = ''
    statusFilter.value = 'Scheduled'
    doctorFilter.value = 'All'
    appointmentDateFilter.value = ''
}

function requestCheckIn(item: (typeof workspace.appointments.value)[number]) {
    selectedAppointment.value = item
    confirmDialog.value = true
}

function confirmCheckIn() {
    if (!selectedAppointment.value) return

    generatedQueue.value = workspace.checkInAppointment(selectedAppointment.value.id)
    confirmDialog.value = false
    queueDialog.value = true
    selectedAppointment.value = null
}

function statusColor(status: string) {
    if (status === 'Completed') return 'success'
    if (status === 'Cancelled') return 'error'
    if (status === 'Checked In' || status === 'Waiting') return 'info'
    return 'primary'
}
</script>

<template>
    <div class="d-flex justify-space-between align-center mb-6 flex-wrap ga-3">
        <div>
            <h2 class="text-h3 mb-1">Patient Check-in</h2>
            <p class="text-medium-emphasis mb-0">Search scheduled appointments, check patients in, and create queue
                numbers.</p>
        </div>
    </div>

    <UiTitleCard class-name="px-0 pb-0 rounded-md" title="Scheduled Appointments">
        <div class="px-4 py-3">
            <v-row dense align="center">
                <v-col cols="12" md="4">
                    <v-text-field v-model="search" placeholder="Search patient, MRN, doctor, or department"
                        prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable />
                </v-col>
                <v-col cols="12" sm="6" md="2">
                    <v-select v-model="statusFilter" :items="statusOptions" label="Status" variant="outlined"
                        density="compact" hide-details />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                    <v-select v-model="doctorFilter" :items="doctorOptions" label="Doctor" variant="outlined"
                        density="compact" hide-details />
                </v-col>
                <v-col cols="12" sm="6" md="2">
                    <v-text-field v-model="appointmentDateFilter" label="Appointment Date" type="date"
                        variant="outlined" density="compact" hide-details />
                </v-col>
                <v-col cols="12" sm="6" md="1" class="d-flex justify-end">
                    <v-btn color="secondary" variant="tonal" size="small" icon="mdi-filter-remove-outline"
                        aria-label="Reset filters" @click="resetFilters" />
                </v-col>
            </v-row>

            <div class="d-flex align-center justify-space-between flex-wrap ga-3 mt-3">
                <div class="text-body-2 text-medium-emphasis">
                    Showing {{ scheduledAppointments.length }} of {{ workspace.appointments.value.length }} appointments
                </div>
            </div>
        </div>

        <v-table class="text-no-wrap">
            <thead>
                <tr>
                    <th>Patient</th>
                    <th>Schedule</th>
                    <th>Doctor</th>
                    <th>Status</th>
                    <th class="text-right">Action</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in scheduledAppointments" :key="item.id">
                    <td>
                        <div class="font-weight-medium">{{ item.patientName }}</div>
                        <div class="text-caption text-medium-emphasis">{{ item.medicalRecordNumber }}</div>
                    </td>
                    <td>
                        <div>{{ item.appointmentDate }} - {{ item.appointmentTime }}</div>
                        <div class="text-caption text-medium-emphasis">{{ item.type }}</div>
                    </td>
                    <td>
                        <div>{{ item.doctorName }}</div>
                        <div class="text-caption text-medium-emphasis">{{ item.department }}</div>
                    </td>
                    <td>
                        <v-chip size="small" :color="statusColor(item.status)" variant="tonal">{{ item.status
                            }}</v-chip>
                    </td>
                    <td class="text-right">
                        <v-btn color="primary" variant="tonal" size="small" :disabled="item.status !== 'Scheduled'"
                            @click="requestCheckIn(item)">
                            Check-in
                        </v-btn>
                    </td>
                </tr>
                <tr v-if="scheduledAppointments.length === 0">
                    <td colspan="5" class="text-center py-6 text-medium-emphasis">No appointment found.</td>
                </tr>
            </tbody>
        </v-table>
    </UiTitleCard>

    <v-dialog v-model="confirmDialog" max-width="520">
        <v-card v-if="selectedAppointment" rounded="lg">
            <v-card-title>Confirm Patient Check-in</v-card-title>
            <v-card-text>
                <p class="text-body-2 text-medium-emphasis mb-4">
                    This will mark the appointment as checked in and generate a queue number.
                </p>
                <v-row dense>
                    <v-col cols="12" sm="6">
                        <div class="text-caption text-medium-emphasis">Patient</div>
                        <div class="text-body-1 font-weight-medium">{{ selectedAppointment.patientName }}</div>
                    </v-col>
                    <v-col cols="12" sm="6">
                        <div class="text-caption text-medium-emphasis">MRN</div>
                        <div class="text-body-1 font-weight-medium">{{ selectedAppointment.medicalRecordNumber }}</div>
                    </v-col>
                    <v-col cols="12" sm="6">
                        <div class="text-caption text-medium-emphasis">Doctor</div>
                        <div class="text-body-1 font-weight-medium">{{ selectedAppointment.doctorName }}</div>
                    </v-col>
                    <v-col cols="12" sm="6">
                        <div class="text-caption text-medium-emphasis">Schedule</div>
                        <div class="text-body-1 font-weight-medium">
                            {{ selectedAppointment.appointmentDate }} - {{ selectedAppointment.appointmentTime }}
                        </div>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-card-actions class="px-6 pb-4">
                <v-spacer />
                <v-btn variant="text" @click="confirmDialog = false">Cancel</v-btn>
                <v-btn v-if="can('check-in.create')" color="primary" variant="flat"
                    prepend-icon="mdi-check-circle-outline" @click="confirmCheckIn">
                    Confirm Check-in
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="queueDialog" max-width="460">
        <v-card v-if="generatedQueue" rounded="lg">
            <v-card-title>Queue Generated</v-card-title>
            <v-card-text class="text-center py-8">
                <div class="text-caption text-medium-emphasis text-uppercase mb-2">Queue Number</div>
                <div class="text-h1 font-weight-bold mb-3">{{ generatedQueue.queueNumber }}</div>
                <div class="text-h5 mb-1">{{ generatedQueue.patientName }}</div>
                <div class="text-body-2 text-medium-emphasis">{{ generatedQueue.department }} - {{
                    generatedQueue.doctorName }}</div>
            </v-card-text>
            <v-card-actions class="px-6 pb-4">
                <v-spacer />
                <v-btn variant="text" @click="queueDialog = false">Close</v-btn>
                <v-btn color="secondary" variant="tonal" prepend-icon="mdi-printer-outline"
                    to="/receptionist/queue/print">
                    Print
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
