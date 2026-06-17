<script setup lang="ts">
const workspace = useReceptionistWorkspace()
const selectedQueueId = ref(workspace.queue.value[0]?.id ?? '')
const search = ref('')
const detailDialog = ref(false)

const selectedQueue = computed(() => workspace.queue.value.find((item) => item.id === selectedQueueId.value) ?? workspace.queue.value[0])

const filteredQueue = computed(() => {
    const keyword = search.value.toLowerCase()
    return workspace.queue.value.filter((item) =>
        item.queueNumber.toLowerCase().includes(keyword) ||
        item.patientName.toLowerCase().includes(keyword) ||
        item.medicalRecordNumber.toLowerCase().includes(keyword) ||
        item.doctorName.toLowerCase().includes(keyword) ||
        item.department.toLowerCase().includes(keyword)
    )
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

function selectForPrint(id: string) {
    selectedQueueId.value = id
    nextTick(() => window.print())
}

function printQueue() {
    window.print()
}
</script>

<template>
    <div class="d-flex justify-space-between align-center mb-6 flex-wrap ga-3 no-print">
        <div>
            <h2 class="text-h3 mb-1">Print Queue Number</h2>
            <p class="text-medium-emphasis mb-0">Select a queue from the table, review the detail, and print the queue ticket.</p>
        </div>
    </div>

    <UiTitleCard class-name="px-0 pb-0 rounded-md no-print" title="Queue Print List">
        <div class="px-4 py-3 d-flex align-center justify-space-between flex-wrap ga-3">
            <v-text-field
                v-model="search"
                placeholder="Search queue number, patient, MRN, doctor, or department"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                style="max-width: 430px"
            />
            <div v-if="selectedQueue" class="text-body-2 text-medium-emphasis">
                Selected: <span class="font-weight-medium text-high-emphasis">{{ selectedQueue.queueNumber }} - {{ selectedQueue.patientName }}</span>
            </div>
        </div>

        <v-table class="text-no-wrap">
            <thead>
                <tr>
                    <th>Queue Number</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Check-in</th>
                    <th>Status</th>
                    <th class="text-right">Action</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in filteredQueue" :key="item.id" :class="{ 'selected-row': item.id === selectedQueue?.id }">
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
                        <v-chip size="small" variant="tonal" :color="statusColor(item.status)">
                            {{ item.status }}
                        </v-chip>
                    </td>
                    <td class="text-right">
                        <div class="d-flex justify-end ga-2">
                            <v-btn size="small" color="secondary" variant="tonal" @click="openDetail(item.id)">
                                Detail
                            </v-btn>
                            <v-btn size="small" color="primary" variant="flat" prepend-icon="mdi-printer-outline" @click="selectForPrint(item.id)">
                                Print
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

    <v-dialog v-model="detailDialog" max-width="560" class="no-print">
        <v-card v-if="selectedQueue">
            <v-card-title class="text-h5">Queue Detail</v-card-title>
            <v-divider />
            <v-card-text class="d-flex flex-column ga-3">
                <div class="text-center py-3">
                    <div class="text-caption text-medium-emphasis text-uppercase mb-2">Queue Number</div>
                    <div class="detail-queue-number font-weight-bold">{{ selectedQueue.queueNumber }}</div>
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
                <v-btn color="primary" variant="flat" prepend-icon="mdi-printer-outline" @click="printQueue">Print</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <div v-if="selectedQueue" class="print-only">
        <div class="queue-ticket">
            <div class="text-center">
                <div class="ticket-title">Healthcare Queue</div>
                <div class="ticket-date">{{ new Date().toLocaleDateString('en-US', { dateStyle: 'full' }) }}</div>
                <div class="ticket-divider" />
                <div class="ticket-label">Queue Number</div>
                <div class="queue-number">{{ selectedQueue.queueNumber }}</div>
                <div class="ticket-patient">{{ selectedQueue.patientName }}</div>
                <div class="ticket-muted">{{ selectedQueue.medicalRecordNumber }}</div>
                <div class="ticket-divider" />
            </div>
            <div class="ticket-row">
                <span>Department</span>
                <strong>{{ selectedQueue.department }}</strong>
            </div>
            <div class="ticket-row">
                <span>Doctor</span>
                <strong>{{ selectedQueue.doctorName }}</strong>
            </div>
            <div class="ticket-row">
                <span>Appointment</span>
                <strong>{{ selectedQueue.appointmentTime }}</strong>
            </div>
            <div class="ticket-row">
                <span>Check-in</span>
                <strong>{{ formatTime(selectedQueue.checkedInAt) }}</strong>
            </div>
        </div>
    </div>
</template>

<style scoped>
.selected-row {
    background-color: rgba(var(--v-theme-primary), 0.06);
}

.queue-ticket {
    width: 360px;
    margin: 0 auto;
    padding: 32px;
    border: 1px dashed #222;
    color: #111;
    background: #fff;
}

.queue-number {
    font-size: 72px;
    line-height: 1;
    font-weight: 700;
    margin: 12px 0 16px;
    background: transparent;
}

.queue-number-pill {
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    color: rgb(var(--v-theme-primary));
    background: transparent;
    font-weight: 700;
}

.detail-queue-number {
    font-size: 56px;
    line-height: 1;
    background: transparent;
}

.print-only {
    display: none;
}

.ticket-title {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.ticket-date,
.ticket-muted {
    color: #666;
    font-size: 13px;
}

.ticket-label {
    color: #666;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.ticket-patient {
    font-size: 20px;
    font-weight: 700;
}

.ticket-divider {
    border-top: 1px solid #ddd;
    margin: 24px 0;
}

.ticket-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    font-size: 14px;
    margin-bottom: 10px;
}

.ticket-row span {
    color: #666;
}

@media print {
    @page {
        size: 80mm 140mm;
        margin: 0;
    }

    :global(html),
    :global(body),
    :global(#__nuxt) {
        width: 80mm !important;
        min-width: 80mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
    }

    :global(.v-application),
    :global(.v-application__wrap),
    :global(.v-main),
    :global(.v-main__wrap),
    :global(.page-wrapper),
    :global(.v-container) {
        width: 80mm !important;
        min-width: 80mm !important;
        max-width: 80mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        display: block !important;
    }

    :global(body *) {
        visibility: hidden !important;
    }

    .no-print {
        display: none !important;
    }

    .print-only {
        display: block;
        visibility: visible !important;
        position: fixed;
        inset: 0 auto auto 0;
        width: 80mm;
        margin: 0;
        padding: 0;
    }

    .print-only,
    .print-only * {
        visibility: visible !important;
    }

    .queue-ticket {
        width: 80mm;
        min-height: 120mm;
        margin: 0;
        padding: 8mm 6mm;
        border: 0;
        box-shadow: none !important;
        page-break-after: avoid;
        page-break-inside: avoid;
    }

    .queue-number {
        font-size: 56px;
        background: transparent !important;
    }

    .ticket-patient {
        font-size: 18px;
    }
}
</style>
