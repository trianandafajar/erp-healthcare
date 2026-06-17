<script setup lang="ts">
const workspace = useReceptionistWorkspace()
const search = ref('')
const statusFilter = ref('All')
const departmentFilter = ref('All')
const doctorFilter = ref('All')
const checkInFrom = ref('')
const checkInTo = ref('')
const detailDialog = ref(false)
const selectedQueueId = ref('')

const selectedQueue = computed(() => workspace.queue.value.find((item) => item.id === selectedQueueId.value) ?? null)

const statusOptions = ['All', 'Waiting', 'Called', 'In Service', 'Skipped', 'Done']
const departmentOptions = computed(() => ['All', ...new Set(workspace.queue.value.map((item) => item.department))])
const doctorOptions = computed(() => ['All', ...new Set(workspace.queue.value.map((item) => item.doctorName))])

const filteredQueue = computed(() => {
    const keyword = search.value.toLowerCase()
    return workspace.queue.value.filter((item) => {
        const checkInTime = item.checkedInAt.slice(11, 16)
        const matchesSearch =
            item.queueNumber.toLowerCase().includes(keyword) ||
            item.patientName.toLowerCase().includes(keyword) ||
            item.medicalRecordNumber.toLowerCase().includes(keyword) ||
            item.doctorName.toLowerCase().includes(keyword) ||
            item.department.toLowerCase().includes(keyword)

        const matchesStatus = statusFilter.value === 'All' || item.status === statusFilter.value
        const matchesDepartment = departmentFilter.value === 'All' || item.department === departmentFilter.value
        const matchesDoctor = doctorFilter.value === 'All' || item.doctorName === doctorFilter.value
        const matchesFrom = !checkInFrom.value || checkInTime >= checkInFrom.value
        const matchesTo = !checkInTo.value || checkInTime <= checkInTo.value

        return matchesSearch && matchesStatus && matchesDepartment && matchesDoctor && matchesFrom && matchesTo
    })
})

function statusColor(status: string) {
    if (status === 'Done') return 'success'
    if (status === 'Skipped') return 'error'
    if (status === 'In Service') return 'primary'
    if (status === 'Called') return 'info'
    return 'warning'
}

function formatTime(value: string) {
    return new Date(value).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    })
}

function openDetail(id: string) {
    selectedQueueId.value = id
    detailDialog.value = true
}

function nextQueueAction(status: string) {
    if (status === 'Waiting') {
        return { label: 'Call', color: 'info', nextStatus: 'Called' as const }
    }

    if (status === 'Called') {
        return { label: 'Serve', color: 'primary', nextStatus: 'In Service' as const }
    }

    if (status === 'In Service') {
        return { label: 'Done', color: 'success', nextStatus: 'Done' as const }
    }

    return null
}

function resetFilters() {
    search.value = ''
    statusFilter.value = 'All'
    departmentFilter.value = 'All'
    doctorFilter.value = 'All'
    checkInFrom.value = ''
    checkInTo.value = ''
}
</script>

<template>
    <div class="d-flex justify-space-between align-center mb-6 flex-wrap ga-3">
        <div>
            <h2 class="text-h3 mb-1">Patient Queue</h2>
            <p class="text-medium-emphasis mb-0">Monitor queue numbers and update patient status at the front desk.</p>
        </div>
        <v-btn color="secondary" variant="tonal" prepend-icon="mdi-printer-outline" to="/receptionist/queue/print">Print Number</v-btn>
    </div>

    <UiTitleCard class-name="px-0 pb-0 rounded-md" title="Queue Board">
        <div class="px-4 py-3">
            <v-row dense>
                <v-col cols="12" md="4">
                    <v-text-field
                        v-model="search"
                        placeholder="Search queue number, patient, MRN, doctor, or department"
                        prepend-inner-icon="mdi-magnify"
                        variant="outlined"
                        density="compact"
                        hide-details
                        clearable
                    />
                </v-col>
                <v-col cols="12" sm="6" md="2">
                    <v-select v-model="statusFilter" :items="statusOptions" label="Status" variant="outlined" density="compact" hide-details />
                </v-col>
                <v-col cols="12" sm="6" md="2">
                    <v-select v-model="departmentFilter" :items="departmentOptions" label="Department" variant="outlined" density="compact" hide-details />
                </v-col>
                <v-col cols="12" sm="6" md="2">
                    <v-select v-model="doctorFilter" :items="doctorOptions" label="Doctor" variant="outlined" density="compact" hide-details />
                </v-col>
                <v-col cols="6" sm="3" md="1">
                    <v-text-field v-model="checkInFrom" type="time" label="From" variant="outlined" density="compact" hide-details />
                </v-col>
                <v-col cols="6" sm="3" md="1">
                    <v-text-field v-model="checkInTo" type="time" label="To" variant="outlined" density="compact" hide-details />
                </v-col>
            </v-row>
            <div class="d-flex align-center justify-space-between flex-wrap ga-3 mt-3">
                <div class="text-caption text-medium-emphasis">
                    Showing {{ filteredQueue.length }} of {{ workspace.queue.value.length }} queue records
                </div>
                <v-btn size="small" variant="text" color="secondary" prepend-icon="mdi-filter-remove-outline" @click="resetFilters">
                    Reset Filters
                </v-btn>
            </div>
        </div>

        <v-table class="text-no-wrap">
            <thead>
                <tr>
                    <th>Queue</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Check-in</th>
                    <th>Status</th>
                    <th class="text-right">Action</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in filteredQueue" :key="item.id">
                    <td>
                        <span class="queue-number-pill">{{ item.queueNumber }}</span>
                    </td>
                    <td>
                        <div class="font-weight-medium">{{ item.patientName }}</div>
                        <div class="text-caption text-medium-emphasis">{{ item.medicalRecordNumber }}</div>
                    </td>
                    <td>
                        <div>{{ item.doctorName }}</div>
                        <div class="text-caption text-medium-emphasis">{{ item.department }} - {{ item.appointmentTime }}</div>
                    </td>
                    <td>{{ formatTime(item.checkedInAt) }}</td>
                    <td>
                        <v-chip size="small" variant="tonal" :color="statusColor(item.status)">{{ item.status }}</v-chip>
                    </td>
                    <td class="text-right">
                        <div class="d-flex justify-end ga-2">
                            <v-btn size="small" color="secondary" variant="tonal" @click="openDetail(item.id)">Detail</v-btn>
                            <v-btn
                                v-if="nextQueueAction(item.status)"
                                size="small"
                                :color="nextQueueAction(item.status)?.color"
                                variant="tonal"
                                @click="workspace.updateQueueStatus(item.id, nextQueueAction(item.status)!.nextStatus)"
                            >
                                {{ nextQueueAction(item.status)?.label }}
                            </v-btn>
                            <v-btn
                                v-else
                                size="small"
                                color="secondary"
                                variant="text"
                                disabled
                            >
                                Closed
                            </v-btn>
                        </div>
                    </td>
                </tr>
                <tr v-if="filteredQueue.length === 0">
                    <td colspan="6" class="text-center py-6 text-medium-emphasis">No queue found.</td>
                </tr>
            </tbody>
        </v-table>
    </UiTitleCard>

    <v-dialog v-model="detailDialog" max-width="560">
        <v-card v-if="selectedQueue">
            <v-card-title class="text-h5">Queue Detail</v-card-title>
            <v-divider />
            <v-card-text class="d-flex flex-column ga-3">
                <div class="text-center py-3">
                    <div class="text-caption text-medium-emphasis text-uppercase mb-2">Queue Number</div>
                    <div class="queue-detail-number font-weight-bold">{{ selectedQueue.queueNumber }}</div>
                </div>
                <v-divider />
                <div class="d-flex justify-space-between ga-4">
                    <span class="text-medium-emphasis">Patient</span>
                    <span class="font-weight-medium">{{ selectedQueue.patientName }}</span>
                </div>
                <div class="d-flex justify-space-between ga-4">
                    <span class="text-medium-emphasis">MRN</span>
                    <span>{{ selectedQueue.medicalRecordNumber }}</span>
                </div>
                <div class="d-flex justify-space-between ga-4">
                    <span class="text-medium-emphasis">Department</span>
                    <span>{{ selectedQueue.department }}</span>
                </div>
                <div class="d-flex justify-space-between ga-4">
                    <span class="text-medium-emphasis">Doctor</span>
                    <span>{{ selectedQueue.doctorName }}</span>
                </div>
                <div class="d-flex justify-space-between ga-4">
                    <span class="text-medium-emphasis">Appointment</span>
                    <span>{{ selectedQueue.appointmentTime }}</span>
                </div>
                <div class="d-flex justify-space-between ga-4">
                    <span class="text-medium-emphasis">Check-in</span>
                    <span>{{ formatTime(selectedQueue.checkedInAt) }}</span>
                </div>
                <div class="d-flex justify-space-between ga-4">
                    <span class="text-medium-emphasis">Status</span>
                    <v-chip size="small" variant="tonal" :color="statusColor(selectedQueue.status)">
                        {{ selectedQueue.status }}
                    </v-chip>
                </div>
            </v-card-text>
            <v-card-actions class="justify-end">
                <v-btn variant="text" @click="detailDialog = false">Close</v-btn>
                <v-btn
                    v-if="nextQueueAction(selectedQueue.status)"
                    :color="nextQueueAction(selectedQueue.status)?.color"
                    variant="flat"
                    @click="workspace.updateQueueStatus(selectedQueue.id, nextQueueAction(selectedQueue.status)!.nextStatus)"
                >
                    {{ nextQueueAction(selectedQueue.status)?.label }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style scoped>
.queue-number-pill {
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    color: rgb(var(--v-theme-primary));
    background: transparent !important;
    background-color: transparent !important;
    box-shadow: none !important;
    border: 0 !important;
    font-weight: 700;
}

.queue-detail-number {
    font-size: 56px;
    line-height: 1;
    background: transparent !important;
    background-color: transparent !important;
}
</style>
