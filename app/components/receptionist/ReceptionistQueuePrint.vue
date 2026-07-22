<script setup lang="ts">
definePageMeta({
    middleware: ['auth'],
})

interface AppointmentRow {
    id: string
    appointment_date: string
    appointment_time: string | null
    type: string
    status: string
    queue_number: string | null
    updated_at: string
    patient: { id: string; full_name: string; medical_record_number: string } | null
    doctor: {
        id: string
        specialization: string | null
        profile: { id: string; full_name: string } | null
        department: { id: string; name: string } | null
    } | null
    department: { id: string; name: string } | null
}

const { can } = usePermission()

const search = ref('')
const detailDialog = ref(false)
const selectedId = ref<string | null>(null)

const { data, pending } = await useFetch<{ appointments: AppointmentRow[] }>('/api/appointments')

const appointments = computed(() => data.value?.appointments ?? [])

const selectedQueue = computed(() =>
    selectedId.value
        ? appointments.value.find((a) => a.id === selectedId.value) ?? null
        : null
)

const statusColors: Record<string, string> = {
    waiting: 'warning',
    in_progress: 'primary',
    done: 'success',
    cancelled: 'error',
}

const filteredQueue = computed(() => {
    const keyword = search.value.toLowerCase()
    return appointments.value.filter((item) =>
        (item.queue_number ?? '').toLowerCase().includes(keyword) ||
        (item.patient?.full_name ?? '').toLowerCase().includes(keyword) ||
        (item.patient?.medical_record_number ?? '').toLowerCase().includes(keyword) ||
        (item.doctor?.profile?.full_name ?? '').toLowerCase().includes(keyword) ||
        (item.department?.name ?? item.doctor?.department?.name ?? '').toLowerCase().includes(keyword)
    )
})

function formatTime(value: string) {
    if (!value) return '-'
    return new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function getDeptName(item: AppointmentRow) {
    return item.department?.name ?? item.doctor?.department?.name ?? '-'
}

function openDetail(id: string) {
    selectedId.value = id
    detailDialog.value = true
}

function selectForPrint(id: string) {
    selectedId.value = id
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
            <p class="text-medium-emphasis mb-0">Select a queue from the table, review the detail, and print the queue
                ticket.</p>
        </div>
    </div>

    <UiTitleCard class-name="px-0 pb-0 rounded-md no-print">
        <div class="px-4 py-3 d-flex align-center justify-space-between flex-wrap ga-3">
            <v-text-field v-model="search" placeholder="Search queue number, patient, MRN, doctor, or department"
                prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable
                style="max-width: 430px" />
            <div v-if="selectedQueue" class="text-body-2 text-medium-emphasis">
                Selected: <span class="font-weight-medium text-high-emphasis">
                    {{ selectedQueue.queue_number }} - {{ selectedQueue.patient?.full_name }}
                </span>
            </div>
        </div>

        <v-divider />

        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Queue Number</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Patient</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Doctor</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Updated</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Status</th>
                    <th class="text-no-wrap text-right text-caption font-weight-bold text-uppercase">Action</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending">
                    <td colspan="6" class="text-center py-8">
                        <v-progress-circular indeterminate color="primary" />
                    </td>
                </tr>
                <tr v-else-if="filteredQueue.length === 0">
                    <td colspan="6" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-printer-off-outline" size="32" class="mb-2 d-block mx-auto" />
                        No queue found
                    </td>
                </tr>
                <tr v-else v-for="item in filteredQueue" :key="item.id"
                    :class="{ 'selected-row': item.id === selectedId }">
                    <td class="py-3">
                        <span class="text-primary font-weight-bold text-body-1">
                            {{ item.queue_number ?? '-' }}
                        </span>
                    </td>
                    <td class="py-3">
                        <div class="text-body-2 font-weight-medium">{{ item.patient?.full_name ?? '-' }}</div>
                        <div class="text-caption text-medium-emphasis">{{ item.patient?.medical_record_number ?? '-' }}
                        </div>
                    </td>
                    <td class="py-3 text-body-2">
                        <div>{{ item.doctor?.profile?.full_name ?? '-' }}</div>
                        <div class="text-caption text-medium-emphasis">
                            {{ getDeptName(item) }}
                            <template v-if="item.appointment_time"> · {{ item.appointment_time.slice(0, 5) }}</template>
                        </div>
                    </td>
                    <td class="py-3 text-body-2 text-medium-emphasis">{{ formatTime(item.updated_at) }}</td>
                    <td class="py-3">
                        <v-chip size="small" variant="tonal" :color="statusColors[item.status] ?? 'default'">
                            {{ item.status.replace('_', ' ') }}
                        </v-chip>
                    </td>
                    <td class="py-3 text-right">
                        <div class="d-flex justify-end ga-2">
                            <v-btn size="small" color="secondary" variant="tonal" @click="openDetail(item.id)">
                                Detail
                            </v-btn>
                            <v-btn size="small" color="primary" variant="flat" prepend-icon="mdi-printer-outline"
                                @click="selectForPrint(item.id)">
                                Print
                            </v-btn>
                        </div>
                    </td>
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
                    <div class="detail-queue-number text-primary font-weight-bold">{{ selectedQueue.queue_number ?? '-'
                        }}
                    </div>
                </div>
                <v-divider />
                <div class="d-flex justify-space-between ga-4">
                    <span class="text-medium-emphasis">Patient</span>
                    <span class="font-weight-medium">{{ selectedQueue.patient?.full_name ?? '-' }}</span>
                </div>
                <div class="d-flex justify-space-between ga-4">
                    <span class="text-medium-emphasis">MRN</span>
                    <span>{{ selectedQueue.patient?.medical_record_number ?? '-' }}</span>
                </div>
                <div class="d-flex justify-space-between ga-4">
                    <span class="text-medium-emphasis">Department</span>
                    <span>{{ getDeptName(selectedQueue) }}</span>
                </div>
                <div class="d-flex justify-space-between ga-4">
                    <span class="text-medium-emphasis">Doctor</span>
                    <span>{{ selectedQueue.doctor?.profile?.full_name ?? '-' }}</span>
                </div>
                <div class="d-flex justify-space-between ga-4">
                    <span class="text-medium-emphasis">Appointment</span>
                    <span>{{ selectedQueue.appointment_date }} {{ selectedQueue.appointment_time?.slice(0, 5) ?? ''
                        }}</span>
                </div>
                <div class="d-flex justify-space-between ga-4">
                    <span class="text-medium-emphasis">Last Updated</span>
                    <span>{{ formatTime(selectedQueue.updated_at) }}</span>
                </div>
                <div class="d-flex justify-space-between ga-4">
                    <span class="text-medium-emphasis">Status</span>
                    <v-chip size="small" variant="tonal" :color="statusColors[selectedQueue.status] ?? 'default'">
                        {{ selectedQueue.status.replace('_', ' ') }}
                    </v-chip>
                </div>
            </v-card-text>
            <v-card-actions class="justify-end">
                <v-btn variant="text" @click="detailDialog = false">Close</v-btn>
                <v-btn v-if="can('appointment.edit')" color="primary" variant="flat" prepend-icon="mdi-printer-outline"
                    @click="printQueue">
                    Print
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <!-- Print Ticket -->
    <div v-if="selectedQueue" class="print-only">
        <div class="queue-ticket">
            <div class="text-center">
                <div class="ticket-title">Healthcare Queue</div>
                <div class="ticket-date">{{ new Date().toLocaleDateString('en-US', { dateStyle: 'full' }) }}</div>
                <div class="ticket-divider" />
                <div class="ticket-label">Queue Number</div>
                <div class="queue-number">{{ selectedQueue.queue_number ?? '-' }}</div>
                <div class="ticket-patient">{{ selectedQueue.patient?.full_name ?? '-' }}</div>
                <div class="ticket-muted">{{ selectedQueue.patient?.medical_record_number ?? '-' }}</div>
                <div class="ticket-divider" />
            </div>
            <div class="ticket-row">
                <span>Department</span>
                <strong>{{ getDeptName(selectedQueue) }}</strong>
            </div>
            <div class="ticket-row">
                <span>Doctor</span>
                <strong>{{ selectedQueue.doctor?.profile?.full_name ?? '-' }}</strong>
            </div>
            <div class="ticket-row">
                <span>Appointment</span>
                <strong>{{ selectedQueue.appointment_date }} {{ selectedQueue.appointment_time?.slice(0, 5) ?? ''
                    }}</strong>
            </div>
            <div class="ticket-row">
                <span>Updated</span>
                <strong>{{ formatTime(selectedQueue.updated_at) }}</strong>
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

.detail-queue-number {
    font-size: 56px;
    line-height: 1;
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