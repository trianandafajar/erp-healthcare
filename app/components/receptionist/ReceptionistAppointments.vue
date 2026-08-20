<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
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
    chief_complaint: string | null
    notes: string | null
    queue_number: string | null
    patient: { id: string; full_name: string; medical_record_number: string } | null
    doctor: {
        id: string
        specialization: string | null
        profile: { id: string; full_name: string } | null
        department: { id: string; name: string } | null
    } | null
    department: { id: string; name: string } | null
}

interface Schedule {
    id: string
    day_of_week: number
    day_name: string
    start_time: string
    end_time: string
    doctor_id: string | null
    doctor_name: string
    department_id: string | null
    department_name: string
}

const { can } = usePermission()

const search = ref('')
const statusFilter = ref('all')
const dialog = ref(false)
const loading = ref(false)
const formError = ref('')

const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('success')

function notify(msg: string, color = 'success') {
    snackbarMsg.value = msg
    snackbarColor.value = color
    snackbar.value = true
}

const form = reactive({
    patient_id: '',
    doctor_schedule_id: '',
    appointment_date: new Date().toISOString().slice(0, 10),
    appointment_time: '',
    type: 'appointment',
    chief_complaint: '',
    notes: '',
})

const { data: appointmentsData, pending, refresh } = await useFetch<{ appointments: AppointmentRow[] }>('/api/appointments')
const { data: schedulesData } = await useFetch<{ schedules: Schedule[] }>('/api/doctor-schedules')
const { data: patientsData } = await useFetch<{ patients: any[] }>('/api/patients')

const appointments = computed(() => appointmentsData.value?.appointments ?? [])
const schedules = computed(() => schedulesData.value?.schedules ?? [])
const patients = computed(() => patientsData.value?.patients ?? [])

const patientOptions = computed(() => patients.value.map((p) => ({
    title: `${p.full_name} (${p.medical_record_number ?? '-'})`,
    value: p.id,
})))

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const scheduleOptions = computed(() => schedules.value.map((s) => ({
    title: `${s.doctor_name} - ${s.department_name}`,
    value: s.id,
    props: {
        subtitle: `${s.day_name}, ${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)}`,
    },
})))

const selectedSchedule = computed(() =>
    schedules.value.find((s) => s.id === form.doctor_schedule_id) ?? null
)

const scheduleTimeHint = computed(() => {
    if (!selectedSchedule.value) return 'Select a doctor schedule to see available time.'
    const s = selectedSchedule.value
    return `Available: ${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)} (${s.day_name})`
})

watch(() => form.doctor_schedule_id, () => {
    formError.value = ''
    if (!selectedSchedule.value) {
        form.appointment_time = ''
        return
    }
    if (!form.appointment_time ||
        form.appointment_time < selectedSchedule.value.start_time ||
        form.appointment_time > selectedSchedule.value.end_time
    ) {
        form.appointment_time = selectedSchedule.value.start_time.slice(0, 5)
    }
})

const statusOptions = [
    { label: 'All', value: 'all' },
    { label: 'Waiting', value: 'waiting' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Done', value: 'done' },
    { label: 'Cancelled', value: 'cancelled' },
]

const typeLabels: Record<string, string> = {
    appointment: 'Appointment',
    walkin: 'Walk-in',
    referral: 'Referral',
    consultation: 'Consultation',
    follow_up: 'Follow-up',
}

const statusColors: Record<string, string> = {
    waiting: 'warning',
    in_progress: 'primary',
    done: 'success',
    cancelled: 'error',
}

const filteredAppointments = computed(() => {
    const keyword = search.value.toLowerCase()
    return appointments.value.filter((item) => {
        const matchStatus = statusFilter.value === 'all' || item.status === statusFilter.value
        const matchSearch =
            (item.patient?.full_name ?? '').toLowerCase().includes(keyword) ||
            (item.patient?.medical_record_number ?? '').toLowerCase().includes(keyword) ||
            (item.doctor?.profile?.full_name ?? '').toLowerCase().includes(keyword) ||
            (item.department?.name ?? item.doctor?.department?.name ?? '').toLowerCase().includes(keyword)
        return matchStatus && matchSearch
    })
})

function openCreate() {
    formError.value = ''
    form.patient_id = ''
    form.doctor_schedule_id = ''
    form.appointment_date = new Date().toISOString().slice(0, 10)
    form.appointment_time = ''
    form.type = 'appointment'
    form.chief_complaint = ''
    form.notes = ''
    dialog.value = true
}

async function createAppointment() {
    formError.value = ''
    if (!form.patient_id || !form.appointment_date) {
        formError.value = 'Patient and date are required.'
        return
    }
    if (selectedSchedule.value) {
        if (!form.appointment_time) {
            formError.value = 'Appointment time is required.'
            return
        }
        if (form.appointment_time < selectedSchedule.value.start_time.slice(0, 5) ||
            form.appointment_time > selectedSchedule.value.end_time.slice(0, 5)) {
            formError.value = `Time must be between ${selectedSchedule.value.start_time.slice(0, 5)} and ${selectedSchedule.value.end_time.slice(0, 5)}.`
            return
        }
    }

    loading.value = true
    try {
        await $fetch('/api/appointments', {
            method: 'POST',
            body: {
                patient_id: form.patient_id,
                doctor_id: selectedSchedule.value?.doctor_id ?? null,
                department_id: selectedSchedule.value?.department_id ?? null,
                appointment_date: form.appointment_date,
                appointment_time: form.appointment_time || null,
                type: form.type,
                chief_complaint: form.chief_complaint || null,
                notes: form.notes || null,
            }
        })
        notify('Appointment created successfully')
        await refresh()
        dialog.value = false
    } catch (e: any) {
        formError.value = e?.data?.message ?? 'Something went wrong'
    } finally {
        loading.value = false
    }
}

async function updateStatus(id: string, status: string) {
    try {
        await $fetch(`/api/appointments/${id}`, {
            method: 'PATCH',
            body: { status }
        })
        notify(status === 'in_progress' ? 'Patient checked in' : 'Status updated')
        await refresh()
    } catch (e: any) {
        notify(e?.data?.message ?? 'Failed to update status', 'error')
    }
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex flex-wrap align-center justify-space-between ga-3">
            <div class="min-w-0">
                <v-card-title class="text-h5 text-md-h3">Appointments</v-card-title>
                <v-card-subtitle class="mt-1">Manage patient visit schedules and appointment status</v-card-subtitle>
            </div>
            <v-btn v-if="can('appointment.create')" color="primary" variant="flat" size="large" prepend-icon="mdi-plus"
                density="comfortable" class="flex-shrink-0" @click="openCreate">
                Create Appointment
            </v-btn>
        </div>
    </v-card-item>

    <UiTitleCard class-name="px-0 pb-0 rounded-md">
        <div class="d-flex align-center justify-space-between gap-3 px-4 py-3 flex-wrap">
            <v-text-field v-model="search" placeholder="Search patient, doctor, MRN, or department"
                prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable
                style="max-width: 320px" />

            <v-btn-toggle v-model="statusFilter" density="compact" variant="tonal" divided mandatory color="primary"
                class="flex-wrap">
                <v-btn v-for="s in statusOptions" :key="s.value" :value="s.value" size="small">
                    {{ s.label }}
                </v-btn>
            </v-btn-toggle>
        </div>

        <v-divider />

        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Patient</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Schedule</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Doctor</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Type</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Queue</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Status</th>
                    <th class="text-no-wrap text-right text-caption font-weight-bold text-uppercase">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending" v-for="i in 5" :key="i">
                    <td colspan="7" style="border-bottom: none;">
                        <v-skeleton-loader type="table-row" class="my-1" />
                    </td>
                </tr>
                <tr v-else-if="filteredAppointments.length === 0">
                    <td colspan="7" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-calendar-remove-outline" size="32" class="mb-2 d-block mx-auto" />
                        No appointments found
                    </td>
                </tr>
                <tr v-else v-for="item in filteredAppointments" :key="item.id">
                    <td class="py-3">
                        <span class="text-body-2 font-weight-medium d-block">{{ item.patient?.full_name ?? '-' }}</span>
                        <span class="text-caption text-medium-emphasis">{{ item.patient?.medical_record_number ?? '-'
                            }}</span>
                    </td>
                    <td class="py-3 text-body-2 text-medium-emphasis">
                        <span class="d-block">{{ item.appointment_date }}</span>
                        <span class="text-caption">{{ item.appointment_time?.slice(0, 5) ?? '-' }}</span>
                    </td>
                    <td class="py-3 text-body-2 text-medium-emphasis">
                        <span class="d-block">{{ item.doctor?.profile?.full_name ?? '-' }}</span>
                        <span class="text-caption">
                            {{ item.department?.name ?? item.doctor?.department?.name ?? '-' }}
                        </span>
                    </td>
                    <td class="py-3">
                        <v-chip size="small" variant="tonal" color="secondary" label>
                            {{ typeLabels[item.type] ?? item.type }}
                        </v-chip>
                    </td>
                    <td class="py-3 text-body-2 text-medium-emphasis">
                        {{ item.queue_number ?? '-' }}
                    </td>
                    <td class="py-3">
                        <v-chip size="small" variant="tonal" :color="statusColors[item.status] ?? 'default'" label>
                            {{ item.status.replace('_', ' ') }}
                        </v-chip>
                    </td>
                    <td class="py-3 text-right">
                        <v-btn v-if="can('appointment.edit') && item.status === 'waiting'" size="small" color="primary"
                            variant="tonal" class="mr-1" @click="updateStatus(item.id, 'in_progress')">
                            Check-in
                        </v-btn>
                        <v-btn v-if="can('appointment.edit') && item.status === 'in_progress'" size="small"
                            color="success" variant="tonal" @click="updateStatus(item.id, 'done')">
                            Done
                        </v-btn>
                        <v-btn
                            v-if="can('appointment.edit') && (item.status === 'waiting' || item.status === 'in_progress')"
                            size="small" color="error" variant="text" @click="updateStatus(item.id, 'cancelled')">
                            Cancel
                        </v-btn>
                    </td>
                </tr>
            </tbody>
        </v-table>

        <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
                Showing {{ filteredAppointments.length }} of {{ appointments.length }} appointments
            </span>
        </div>
    </UiTitleCard>

    <v-dialog v-model="dialog" max-width="720">
        <v-card>
            <v-card-title class="text-h5">Create Appointment</v-card-title>
            <v-divider />
            <v-card-text>
                <v-row>
                    <v-col cols="12">
                        <v-autocomplete v-model="form.patient_id" :items="patientOptions" label="Patient"
                            variant="outlined" density="compact" hide-details />
                    </v-col>
                    <v-col cols="12">
                        <v-autocomplete v-model="form.doctor_schedule_id" :items="scheduleOptions"
                            label="Doctor Schedule (optional)" variant="outlined" density="compact" hide-details
                            clearable />
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-text-field :model-value="selectedSchedule?.department_name ?? ''" label="Department"
                            variant="outlined" density="compact" hide-details readonly />
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-select v-model="form.type" :items="[
                            { title: 'Appointment', value: 'appointment' },
                            { title: 'Walk-in', value: 'walkin' },
                            { title: 'Referral', value: 'referral' },
                            { title: 'Consultation', value: 'consultation' },
                            { title: 'Follow-up', value: 'follow_up' },
                        ]" label="Type" variant="outlined" density="compact" hide-details />
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-text-field v-model="form.appointment_date" type="date" label="Date" variant="outlined"
                            density="compact" hide-details />
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-text-field v-model="form.appointment_time" type="time" label="Time" variant="outlined"
                            density="compact" :min="selectedSchedule?.start_time.slice(0, 5)"
                            :max="selectedSchedule?.end_time.slice(0, 5)" :hint="scheduleTimeHint" persistent-hint
                            :disabled="!selectedSchedule" />
                    </v-col>
                    <v-col cols="12">
                        <v-textarea v-model="form.chief_complaint" label="Chief Complaint" variant="outlined"
                            density="compact" rows="2" hide-details />
                    </v-col>
                    <v-col cols="12">
                        <v-textarea v-model="form.notes" label="Notes" variant="outlined" density="compact" rows="2"
                            hide-details />
                    </v-col>
                    <v-col v-if="formError" cols="12">
                        <v-alert color="error" variant="tonal">{{ formError }}</v-alert>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-card-actions class="justify-end">
                <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
                <v-btn color="primary" variant="flat" :loading="loading" :disable="loading"
                    :style="loading ? 'cursor: not-allowed; pointer-events: auto;' : ''" @click="createAppointment">
                    Save
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