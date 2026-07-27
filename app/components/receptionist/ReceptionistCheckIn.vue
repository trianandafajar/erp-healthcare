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
    chief_complaint: string | null
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
const statusFilter = ref('waiting')
const doctorFilter = ref('all')
const dateFilter = ref('')
const confirmDialog = ref(false)
const queueDialog = ref(false)
const selectedAppointment = ref<AppointmentRow | null>(null)
const checkInResult = ref<{ queue_number: string | null; patient_name: string; doctor_name: string; department_name: string } | null>(null)
const loading = ref(false)

// pagination state (same convention as Departments page)
const currentPage = ref(1)
const itemsPerPage = 10

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

const statusOptions = [
    { label: 'Waiting', value: 'waiting' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Done', value: 'done' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'All', value: 'all' },
]

const doctorOptions = computed(() => {
    const names = appointments.value
        .map((a) => a.doctor?.profile?.full_name)
        .filter(Boolean) as string[]
    return ['all', ...new Set(names)]
})

const statusColors: Record<string, string> = {
    waiting: 'warning',
    in_progress: 'primary',
    done: 'success',
    cancelled: 'error',
}

const typeLabels: Record<string, string> = {
    appointment: 'Appointment',
    walkin: 'Walk-in',
    referral: 'Referral',
    consultation: 'Consultation',
    follow_up: 'Follow-up',
}

const filteredAppointments = computed(() => {
    const keyword = search.value.toLowerCase()
    return appointments.value.filter((item) => {
        const matchStatus = statusFilter.value === 'all' || item.status === statusFilter.value
        const matchDoctor = doctorFilter.value === 'all' || item.doctor?.profile?.full_name === doctorFilter.value
        const matchDate = !dateFilter.value || item.appointment_date === dateFilter.value
        const matchSearch =
            (item.patient?.full_name ?? '').toLowerCase().includes(keyword) ||
            (item.patient?.medical_record_number ?? '').toLowerCase().includes(keyword) ||
            (item.doctor?.profile?.full_name ?? '').toLowerCase().includes(keyword) ||
            (item.department?.name ?? item.doctor?.department?.name ?? '').toLowerCase().includes(keyword) ||
            item.type.toLowerCase().includes(keyword)
        return matchStatus && matchDoctor && matchDate && matchSearch
    })
})

// reset to page 1 whenever any filter changes (mirrors Departments' onSearch behavior)
watch([search, statusFilter, doctorFilter, dateFilter], () => {
    currentPage.value = 1
})

const totalAppointments = computed(() => filteredAppointments.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalAppointments.value / itemsPerPage)))

const paginatedAppointments = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    return filteredAppointments.value.slice(start, start + itemsPerPage)
})

function resetFilters() {
    search.value = ''
    statusFilter.value = 'waiting'
    doctorFilter.value = 'all'
    dateFilter.value = ''
    currentPage.value = 1
}

function requestCheckIn(item: AppointmentRow) {
    selectedAppointment.value = item
    confirmDialog.value = true
}

async function confirmCheckIn() {
    if (!selectedAppointment.value) return
    loading.value = true
    try {
        const res = await $fetch<{ appointment: AppointmentRow }>(`/api/appointments/${selectedAppointment.value.id}`, {
            method: 'PATCH',
            body: { status: 'in_progress' }
        })

        checkInResult.value = {
            queue_number: res.appointment.queue_number,
            patient_name: selectedAppointment.value.patient?.full_name ?? '-',
            doctor_name: selectedAppointment.value.doctor?.profile?.full_name ?? '-',
            department_name: selectedAppointment.value.department?.name ?? selectedAppointment.value.doctor?.department?.name ?? '-',
        }

        confirmDialog.value = false
        queueDialog.value = true
        selectedAppointment.value = null
        await refresh()
    } catch (e: any) {
        notify(e?.data?.message ?? 'Failed to check in', 'error')
        confirmDialog.value = false
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div>
            <v-card-title class="text-h3">Patient Check-in</v-card-title>
            <v-card-subtitle class="mt-1">Search scheduled appointments, check patients in, and generate queue
                numbers</v-card-subtitle>
        </div>
    </v-card-item>

    <UiTitleCard class-name="px-0 pb-0 rounded-md">
        <div class="d-flex align-center justify-space-between gap-3 px-4 py-3 flex-wrap">
            <v-text-field v-model="search" placeholder="Search patient, MRN, doctor, or department"
                prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable
                style="max-width: 320px" />
            <div class="d-flex align-center justify-space-between gap-3 px-4 py-3 flex-wrap">
                <v-select v-model="statusFilter" :items="statusOptions" item-title="label" item-value="value"
                    label="Status" variant="outlined" density="compact" hide-details style="max-width: 150px" />
                <v-select v-model="doctorFilter" :items="doctorOptions" label="Doctor" variant="outlined"
                    density="compact" hide-details style="max-width: 180px" />
                <v-text-field v-model="dateFilter" label="Date" type="date" variant="outlined" density="compact"
                    hide-details style="max-width: 160px" />
                <v-btn color="secondary" variant="tonal" size="small" icon="mdi-filter-remove-outline"
                    @click="resetFilters" />
            </div>
        </div>

        <v-divider />

        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Patient</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Schedule</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Doctor</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Type</th>
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
                <tr v-else-if="paginatedAppointments.length === 0">
                    <td colspan="6" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-calendar-check-outline" size="32" class="mb-2 d-block mx-auto" />
                        No appointments found
                    </td>
                </tr>
                <tr v-else v-for="item in paginatedAppointments" :key="item.id">
                    <td class="py-3">
                        <div class="text-body-2 font-weight-medium">{{ item.patient?.full_name ?? '-' }}</div>
                        <div class="text-caption text-medium-emphasis">{{ item.patient?.medical_record_number ?? '-' }}
                        </div>
                    </td>
                    <td class="py-3 text-body-2">
                        <div>{{ item.appointment_date }}</div>
                        <div class="text-caption text-medium-emphasis">{{ item.appointment_time?.slice(0, 5) ?? '-' }}
                        </div>
                    </td>
                    <td class="py-3 text-body-2">
                        <div>{{ item.doctor?.profile?.full_name ?? '-' }}</div>
                        <div class="text-caption text-medium-emphasis">
                            {{ item.department?.name ?? item.doctor?.department?.name ?? '-' }}
                        </div>
                    </td>
                    <td class="py-3">
                        <v-chip size="small" variant="tonal" color="secondary">
                            {{ typeLabels[item.type] ?? item.type }}
                        </v-chip>
                    </td>
                    <td class="py-3">
                        <v-chip size="small" variant="tonal" :color="statusColors[item.status] ?? 'default'">
                            {{ item.status.replace('_', ' ') }}
                        </v-chip>
                    </td>
                    <td class="py-3 text-right">
                        <v-btn color="primary" variant="tonal" size="small" :disabled="item.status !== 'waiting'"
                            @click="requestCheckIn(item)">
                            Check-in
                        </v-btn>
                    </td>
                </tr>
            </tbody>
        </v-table>

        <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
                Showing {{ paginatedAppointments.length }} of {{ totalAppointments }} appointments
            </span>
            <v-pagination v-if="totalPages > 1" v-model="currentPage" :length="totalPages" :total-visible="6"
                density="compact" size="small" />
        </div>
    </UiTitleCard>

    <v-dialog v-model="confirmDialog" max-width="520">
        <v-card v-if="selectedAppointment" rounded="lg">
            <v-card-title>Confirm Patient Check-in</v-card-title>
            <v-card-text>
                <p class="text-body-2 text-medium-emphasis mb-4">
                    This will mark the appointment as in progress and generate a queue number.
                </p>
                <v-row dense>
                    <v-col cols="12" sm="6">
                        <div class="text-caption text-medium-emphasis">Patient</div>
                        <div class="text-body-1 font-weight-medium">{{ selectedAppointment.patient?.full_name ?? '-' }}
                        </div>
                    </v-col>
                    <v-col cols="12" sm="6">
                        <div class="text-caption text-medium-emphasis">MRN</div>
                        <div class="text-body-1 font-weight-medium">{{
                            selectedAppointment.patient?.medical_record_number ?? '-' }}</div>
                    </v-col>
                    <v-col cols="12" sm="6">
                        <div class="text-caption text-medium-emphasis">Doctor</div>
                        <div class="text-body-1 font-weight-medium">{{ selectedAppointment.doctor?.profile?.full_name ??
                            '-' }}
                        </div>
                    </v-col>
                    <v-col cols="12" sm="6">
                        <div class="text-caption text-medium-emphasis">Schedule</div>
                        <div class="text-body-1 font-weight-medium">
                            {{ selectedAppointment.appointment_date }}
                            <template v-if="selectedAppointment.appointment_time">
                                - {{ selectedAppointment.appointment_time.slice(0, 5) }}
                            </template>
                        </div>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-card-actions class="px-6 pb-4">
                <v-spacer />
                <v-btn variant="text" @click="confirmDialog = false">Cancel</v-btn>
                <v-btn v-if="can('appointment.edit')" color="primary" variant="flat"
                    prepend-icon="mdi-check-circle-outline" :loading="loading" @click="confirmCheckIn">
                    Confirm Check-in
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="queueDialog" max-width="460">
        <v-card v-if="checkInResult" rounded="lg">
            <v-card-title>Queue Generated</v-card-title>
            <v-card-text class="text-center py-8">
                <div class="text-caption text-medium-emphasis text-uppercase mb-2">Queue Number</div>
                <div class="text-h1 font-weight-bold mb-3">{{ checkInResult.queue_number ?? '-' }}</div>
                <div class="text-h5 mb-1">{{ checkInResult.patient_name }}</div>
                <div class="text-body-2 text-medium-emphasis">
                    {{ checkInResult.department_name }} - {{ checkInResult.doctor_name }}
                </div>
            </v-card-text>
            <v-card-actions class="px-6 pb-4">
                <v-spacer />
                <v-btn color="secondary" variant="tonal" @click="queueDialog = false">Close</v-btn>
                <v-btn color="primary" variant="flat" prepend-icon="mdi-printer-outline" to="/receptionist/queue/print">
                    Print
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