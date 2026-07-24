<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue'
import ApptModal from './ApptModal.vue'

definePageMeta({
    middleware: ['auth'],
})

const { can } = usePermission()

interface Appointment {
    id: string
    patient_id: string
    appointment_date: string
    appointment_time: string
    type: string
    status: string
    chief_complaint: string | null
    notes: string | null
    created_at: string
    patients: {
        full_name: string
        medical_record_number: string
    } | null
}

const currentPage = ref(1)
const itemsPerPage = 10

const { data, pending, refresh } = await useFetch<{ appointments: any[] }>(
    '/api/doctor/appointments/today'
)

const { data: patientData } = await useFetch('/api/patients')

const patients = ref<any[]>([])

watch(
    patientData,
    (val) => {
        patients.value = val?.patients ?? []
    },
    { immediate: true }
)

const appointments = computed<Appointment[]>(() =>
    data.value?.appointments ?? []
)

const paginatedAppointments = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    return appointments.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() =>
    Math.ceil(appointments.value.length / itemsPerPage)
)

function formatTime(timeStr?: string) {
    if (!timeStr) return '-'
    return timeStr.slice(0, 5)
}

function formatDate(dateStr?: string) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
}

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

function statusColor(status: string) {
    const map: Record<string, string> = {
        waiting: 'warning',
        in_progress: 'info',
        done: 'success',
        cancelled: 'error'
    }
    return map[status] ?? 'default'
}

const dialog = ref(false)
const modalMode = ref<'add' | 'edit' | 'delete'>('add')
const selectedAppointment = ref<Appointment | null>(null)
const loading = ref(false)

function openAdd() {
    modalMode.value = 'add'
    selectedAppointment.value = null
    dialog.value = true
}

function openEdit(appointment: Appointment) {
    modalMode.value = 'edit'
    selectedAppointment.value = appointment
    dialog.value = true
}

function openDelete(appointment: Appointment) {
    modalMode.value = 'delete'
    selectedAppointment.value = appointment
    dialog.value = true
}

function closeModal() {
    dialog.value = false
    selectedAppointment.value = null
}

const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('success')

function notify(msg: string, color = 'success') {
    snackbarMsg.value = msg
    snackbarColor.value = color
    snackbar.value = true
}

const actionLoading = computed(() => loading.value)

async function handleSubmit(payload: any) {
    loading.value = true

    try {
        if (modalMode.value === 'add') {
            await $fetch('/api/doctor/appointments/today', {
                method: 'POST',
                body: {
                    patient_id: payload.patient_id,
                    appointment_date: payload.appointment_date,
                    appointment_time: payload.appointment_time,
                    type: payload.type,
                    status: payload.status,
                    chief_complaint: payload.chief_complaint,
                    notes: payload.notes,
                }
            })

            notify('Appointment created successfully')
        } else if (modalMode.value === 'edit') {
            await $fetch('/api/doctor/appointments/today', {
                method: 'PUT',
                body: {
                    id: payload.id,
                    patient_id: payload.patient_id,
                    appointment_date: payload.appointment_date,
                    appointment_time: payload.appointment_time,
                    type: payload.type,
                    status: payload.status,
                    chief_complaint: payload.chief_complaint,
                    notes: payload.notes,
                }
            })

            notify('Appointment updated successfully')
        } else if (modalMode.value === 'delete') {
            await $fetch('/api/doctor/appointments/today', {
                method: 'DELETE',
                body: {
                    id: payload.id,
                }
            })

            notify('Appointment deleted successfully')
        }

        await refresh()
        closeModal()
    } catch (e: any) {
        notify(
            e?.data?.message ?? e?.message ?? 'Something went wrong',
            'error'
        )
    } finally {
        loading.value = false
    }
}

async function handleCreatePatient(payload: { full_name: string; email: string }) {
    try {
        const res: any = await $fetch('/api/users', {
            method: 'POST',
            body: {
                full_name: payload.full_name,
                email: payload.email,
                password: 'Password123',
                role: 'patient'
            }
        })

        const newPatient = {
            id: res.user.id,
            full_name: payload.full_name,
            medical_record_number: res.user?.medical_record_number ?? ''
        }

        patients.value.unshift(newPatient)
        notify('Patient account created successfully')
        return newPatient
    } catch (error: any) {
        notify(error?.data?.message ?? 'Failed to create patient', 'error')
        return null
    }
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex justify-space-between align-center">
            <div>
                <v-card-title class="text-h3">Today's Appointments</v-card-title>
                <v-card-subtitle class="mt-1">
                    List of patients scheduled today
                </v-card-subtitle>
            </div>
            <v-btn v-if="can('appointment.create')" color="primary" variant="flat" size="large" prepend-icon="mdi-plus"
                density="comfortable" @click="openAdd">
                Add Appointment
            </v-btn>
        </div>
    </v-card-item>

    <UiTitleCard class-name="px-0 pb-0 rounded-md">
        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Patient</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Date</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">time</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Type</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Status</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Complaint</th>
                    <th class="text-no-wrap text-right text-caption font-weight-bold text-uppercase">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending">
                    <td colspan="7" class="text-center py-8">
                        <v-progress-circular indeterminate color="primary" />
                    </td>
                </tr>
                <tr v-else-if="paginatedAppointments.length === 0">
                    <td colspan="7" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-calendar-blank" size="32" class="mb-2 d-block mx-auto" />
                        No appointments today
                    </td>
                </tr>

                <tr v-else v-for="appt in paginatedAppointments" :key="appt.id">
                    <td class="py-3">
                        <div class="d-flex align-center ga-3">
                            <v-avatar size="34" color="primary" variant="tonal">
                                <span class="text-caption font-weight-bold">
                                    {{ getInitials(appt.patients?.full_name ?? '?') }}
                                </span>
                            </v-avatar>
                            <div>
                                <div class="text-body-2 font-weight-medium">
                                    {{ appt.patients?.full_name ?? '-' }}
                                </div>
                                <div class="text-caption text-medium-emphasis">
                                    {{ appt.patients?.medical_record_number ?? '-' }}
                                </div>
                            </div>
                        </div>
                    </td>
                    <td class="py-3 text-body-2">
                        {{ formatDate(appt.appointment_date) }}
                    </td>
                    <td class="py-3 text-body-2">
                        {{ formatTime(appt.appointment_time) }}
                    </td>
                    <td class="py-3">
                        <v-chip v-if="appt.type" size="small" variant="tonal" color="secondary" label>
                            {{ appt.type }}
                        </v-chip>
                        <span v-else class="text-medium-emphasis">-</span>
                    </td>
                    <td class="py-3">
                        <v-chip :color="statusColor(appt.status)" variant="tonal" size="small">
                            {{ appt.status }}
                        </v-chip>
                    </td>
                    <td class="py-3 text-body-2 text-medium-emphasis">
                        {{ appt.chief_complaint ?? '-' }}
                    </td>
                    <td class="py-3 text-right">
                        <v-btn v-if="can('appointment.edit')" icon="mdi-pencil-outline" variant="text" size="small"
                            color="secondary" density="comfortable" @click="openEdit(appt)" />
                        <v-btn v-if="can('appointment.delete')" icon="mdi-delete-outline" variant="text" size="small"
                            color="error" density="comfortable" @click="openDelete(appt)" />
                    </td>
                </tr>
            </tbody>
        </v-table>

        <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
                Showing {{ paginatedAppointments.length }}
                of {{ appointments.length }} appointments
            </span>
            <v-pagination 
                v-if="totalPages > 1" 
                v-model="currentPage" 
                :length="totalPages" 
                :total-visible="6"
                density="compact"
                size="small" 
            />
        </div>
    </UiTitleCard>

    <v-dialog v-model="dialog" max-width="480">
        <ApptModal :loading="actionLoading" :mode="modalMode" :appointment="selectedAppointment" :patients="patients"
            :can-create-patient="can('user.create')" @submit="handleSubmit" @cancel="closeModal"
            @patient-created="(p) => patients.unshift(p)" />
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" :timeout="3000">
        {{ snackbarMsg }}
        <template #actions>
            <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
        </template>
    </v-snackbar>
</template>