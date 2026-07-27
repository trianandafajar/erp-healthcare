<script setup lang="ts">
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue';

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
const statusFilter = ref('all')
const departmentFilter = ref('all')
const doctorFilter = ref('all')
const timeFrom = ref('')
const timeTo = ref('')
const detailDialog = ref(false)
const selectedId = ref<string | null>(null)

const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('success')

function notify(msg: string, color = 'success') {
    snackbarMsg.value = msg
    snackbarColor.value = color
    snackbar.value = true
}

const { data, pending, refresh } = await useFetch<{ appointments: AppointmentRow[] }>('/api/appointments')

const appointments = computed(() => data.value?.appointments ?? [])

const selectedQueue = computed(() =>
    appointments.value.find((a) => a.id === selectedId.value) ?? null
)

const statusOptions = [
    { label: 'All', value: 'all' },
    { label: 'Waiting', value: 'waiting' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Done', value: 'done' },
    { label: 'Cancelled', value: 'cancelled' },
]

const statusColors: Record<string, string> = {
    waiting: 'warning',
    in_progress: 'primary',
    done: 'success',
    cancelled: 'error',
}

const departmentOptions = computed(() => {
    const names = appointments.value
        .map((a) => a.department?.name ?? a.doctor?.department?.name)
        .filter(Boolean) as string[]
    return ['all', ...new Set(names)]
})

const doctorOptions = computed(() => {
    const names = appointments.value
        .map((a) => a.doctor?.profile?.full_name)
        .filter(Boolean) as string[]
    return ['all', ...new Set(names)]
})

const filteredQueue = computed(() => {
    const keyword = search.value.toLowerCase()
    return appointments.value.filter((item) => {
        const updatedTime = item.updated_at?.slice(11, 16) ?? ''
        const deptName = item.department?.name ?? item.doctor?.department?.name ?? ''

        const matchSearch =
            (item.queue_number ?? '').toLowerCase().includes(keyword) ||
            (item.patient?.full_name ?? '').toLowerCase().includes(keyword) ||
            (item.patient?.medical_record_number ?? '').toLowerCase().includes(keyword) ||
            (item.doctor?.profile?.full_name ?? '').toLowerCase().includes(keyword) ||
            deptName.toLowerCase().includes(keyword)

        const matchStatus = statusFilter.value === 'all' || item.status === statusFilter.value
        const matchDept = departmentFilter.value === 'all' || deptName === departmentFilter.value
        const matchDoctor = doctorFilter.value === 'all' || item.doctor?.profile?.full_name === doctorFilter.value
        const matchFrom = !timeFrom.value || updatedTime >= timeFrom.value
        const matchTo = !timeTo.value || updatedTime <= timeTo.value

        return matchSearch && matchStatus && matchDept && matchDoctor && matchFrom && matchTo
    })
})

function resetFilters() {
    search.value = ''
    statusFilter.value = 'all'
    departmentFilter.value = 'all'
    doctorFilter.value = 'all'
    timeFrom.value = ''
    timeTo.value = ''
}

function formatTime(value: string) {
    if (!value) return '-'
    return new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function nextQueueAction(status: string) {
    if (status === 'waiting') return { label: 'Check-in', color: 'primary', next: 'in_progress' }
    if (status === 'in_progress') return { label: 'Done', color: 'success', next: 'done' }
    return null
}

function openDetail(id: string) {
    selectedId.value = id
    detailDialog.value = true
}

async function updateStatus(id: string, status: string) {
    try {
        await $fetch(`/api/appointments/${id}`, {
            method: 'PATCH',
            body: { status }
        })
        notify(status === 'in_progress' ? 'Patient checked in' : `Status updated to ${status}`)
        await refresh()
        if (detailDialog.value) detailDialog.value = false
    } catch (e: any) {
        notify(e?.data?.message ?? 'Failed to update status', 'error')
    }
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex justify-space-between align-center">
            <div>
                <v-card-title class="text-h3">Patient Queue</v-card-title>
                <v-card-subtitle class="mt-1">Monitor queue numbers and update patient status at the front
                    desk</v-card-subtitle>
            </div>
            <v-btn color="secondary" variant="tonal" prepend-icon="mdi-printer-outline" to="/receptionist/queue/print">
                Print Number
            </v-btn>
        </div>
    </v-card-item>

    <UiTitleCard class-name="px-0 pb-0 rounded-md">
        <div class="d-flex align-center justify-space-between gap-3 px-4 py-3 flex-wrap">
            <v-text-field v-model="search"
                placeholder="Search queue number, patient, MRN, doctor, or department"
                prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable
                style="max-width: 320px" />
            <v-select v-model="statusFilter" :items="statusOptions" item-title="label" item-value="value"
                label="Status" variant="outlined" density="compact" hide-details
                style="max-width: 140px" />
            <v-select v-model="departmentFilter" :items="departmentOptions" label="Department"
                variant="outlined" density="compact" hide-details style="max-width: 170px" />
            <v-select v-model="doctorFilter" :items="doctorOptions" label="Doctor" variant="outlined"
                density="compact" hide-details style="max-width: 170px" />
            <v-text-field v-model="timeFrom" type="time" label="From" variant="outlined" density="compact"
                hide-details style="max-width: 140px" />
            <v-text-field v-model="timeTo" type="time" label="To" variant="outlined" density="compact"
                hide-details style="max-width: 140px" />
            <v-btn size="small" variant="text" color="secondary" icon="mdi-filter-remove-outline"
                @click="resetFilters" />
        </div>

        <v-divider />

        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Queue</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Patient</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Doctor</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Updated</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Status</th>
                    <th class="text-no-wrap text-right text-caption font-weight-bold text-uppercase">Action</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending" v-for="i in 5" :key="i">
                    <td colspan="6" style="border-bottom: none;">
                        <v-skeleton-loader type="table-row" class="my-1" />
                    </td>
                </tr>
                <tr v-else-if="filteredQueue.length === 0">
                    <td colspan="6" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-queue-first-in-last-out" size="32" class="mb-2 d-block mx-auto" />
                        No queue records found
                    </td>
                </tr>
                <tr v-else v-for="item in filteredQueue" :key="item.id">
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
                            {{ item.department?.name ?? item.doctor?.department?.name ?? '-' }}
                            <template v-if="item.appointment_time"> · {{ item.appointment_time.slice(0, 5) }}</template>
                        </div>
                    </td>
                    <td class="py-3 text-body-2 text-medium-emphasis">
                        {{ formatTime(item.updated_at) }}
                    </td>
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
                            <v-btn v-if="nextQueueAction(item.status) && can('appointment.edit')" size="small"
                                :color="nextQueueAction(item.status)!.color" variant="tonal"
                                @click="updateStatus(item.id, nextQueueAction(item.status)!.next)">
                                {{ nextQueueAction(item.status)!.label }}
                            </v-btn>
                            <v-btn v-else-if="!nextQueueAction(item.status)" size="small" color="secondary"
                                variant="text" disabled>
                                Closed
                            </v-btn>
                        </div>
                    </td>
                </tr>
            </tbody>
        </v-table>
    </UiTitleCard>

    <!-- Detail Dialog -->
    <v-dialog v-model="detailDialog" max-width="560">
        <v-card v-if="selectedQueue">
            <v-card-title class="text-h5">Queue Detail</v-card-title>
            <v-divider />
            <v-card-text class="d-flex flex-column ga-3">
                <div class="text-center py-3">
                    <div class="text-caption text-medium-emphasis text-uppercase mb-2">Queue Number</div>
                    <div class="text-primary font-weight-bold" style="font-size: 56px; line-height: 1">
                        {{ selectedQueue.queue_number ?? '-' }}
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
                    <span>{{ selectedQueue.department?.name ?? selectedQueue.doctor?.department?.name ?? '-' }}</span>
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
                <v-btn v-if="nextQueueAction(selectedQueue.status) && can('appointment.edit')"
                    :color="nextQueueAction(selectedQueue.status)!.color" variant="flat"
                    @click="updateStatus(selectedQueue.id, nextQueueAction(selectedQueue.status)!.next)">
                    {{ nextQueueAction(selectedQueue.status)!.label }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" timeout="3000">
        {{ snackbarMsg }}
        <template #actions>
            <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
        </template>
    </v-snackbar>
</template>