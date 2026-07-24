<script setup lang="ts">
import { ref, computed } from 'vue'
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue'
import ScheduleModal from './ScheduleModal.vue'

definePageMeta({ middleware: ['auth'] })

const { can } = usePermission()

interface DoctorSchedule {
    id: string
    day_of_week: number
    start_time: string
    end_time: string
    max_patients: number
    is_active: boolean
    created_at: string
}

const DAY_NAMES = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday'
]

const currentPage = ref(1)
const itemsPerPage = 10

const { data, pending, refresh } = await useFetch<{ doctor_schedules: DoctorSchedule[] }>(
    '/api/doctor/schedules'
)

const schedules = computed<DoctorSchedule[]>(() =>
    data.value?.doctor_schedules ?? []
)

const paginatedSchedules = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    return schedules.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() =>
    Math.ceil(schedules.value.length / itemsPerPage)
)

function getDayName(day: number) {
    return DAY_NAMES[day] ?? '-'
}

function formatTime(timeStr?: string) {
    if (!timeStr) return '-'
    const parts = timeStr.split(':')
    if (parts.length < 2) return '-'
    const h = Number(parts[0])
    const m = Number(parts[1])
    if (Number.isNaN(h) || Number.isNaN(m)) return '-'
    const period = h < 12 ? 'AM' : 'PM'
    const hour12 = h % 12 || 12
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

const dialog = ref(false)
const modalMode = ref<'add' | 'edit' | 'delete'>('add')
const selectedSchedule = ref<DoctorSchedule | null>(null)
const loading = ref(false)

function openAdd() {
    modalMode.value = 'add'
    selectedSchedule.value = null
    dialog.value = true
}

function openEdit(schedule: DoctorSchedule) {
    modalMode.value = 'edit'
    selectedSchedule.value = schedule
    dialog.value = true
}

function openDelete(schedule: DoctorSchedule) {
    modalMode.value = 'delete'
    selectedSchedule.value = schedule
    dialog.value = true
}

function closeModal() {
    dialog.value = false
    selectedSchedule.value = null
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
            await $fetch('/api/doctor/schedules', {
                method: 'POST',
                body: {
                    day_of_week: payload.day_of_week,
                    start_time: payload.start_time,
                    end_time: payload.end_time,
                    max_patients: payload.max_patients,
                    is_active: payload.is_active,
                }
            })
            notify('Schedule created successfully')
        } else if (modalMode.value === 'edit') {
            await $fetch('/api/doctor/schedules', {
                method: 'PUT',
                body: {
                    id: payload.id,
                    day_of_week: payload.day_of_week,
                    start_time: payload.start_time,
                    end_time: payload.end_time,
                    max_patients: payload.max_patients,
                    is_active: payload.is_active,
                }
            })
            notify('Schedule updated successfully')
        } else if (modalMode.value === 'delete') {
            await $fetch('/api/doctor/schedules', {
                method: 'DELETE',
                body: { id: payload.id }
            })
            notify('Schedule deleted successfully')
        }

        await refresh()
        closeModal()
    } catch (e: any) {
        notify(e?.data?.message ?? 'Something went wrong', 'error')
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex justify-space-between align-center">
            <div>
                <v-card-title class="text-h3">My Schedule</v-card-title>
                <v-card-subtitle class="mt-1">Manage your weekly availability</v-card-subtitle>
            </div>
            <v-btn v-if="can('schedule.create')" color="primary" variant="flat" size="large" prepend-icon="mdi-plus"
                density="comfortable" @click="openAdd">
                Add Schedule
            </v-btn>
        </div>
    </v-card-item>

    <UiTitleCard class-name="px-0 pb-0 rounded-md">
        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Day</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Start Time</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">End Time</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Max Patients</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Status</th>
                    <th class="text-no-wrap text-right text-caption font-weight-bold text-uppercase">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending">
                    <td colspan="6" class="text-center py-8">
                        <v-progress-circular indeterminate color="primary" />
                    </td>
                </tr>
                <tr v-else-if="paginatedSchedules.length === 0">
                    <td colspan="6" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-calendar-blank" size="32" class="mb-2 d-block mx-auto" />
                        No schedules found
                    </td>
                </tr>
                <tr v-else v-for="schedule in paginatedSchedules" :key="schedule.id">
                    <td class="py-3 text-body-2 font-weight-medium">
                        {{ getDayName(schedule.day_of_week) }}
                    </td>
                    <td class="py-3 text-body-2">{{ formatTime(schedule.start_time) }}</td>
                    <td class="py-3 text-body-2">{{ formatTime(schedule.end_time) }}</td>
                    <td class="py-3 text-body-2">{{ schedule.max_patients }} patients</td>
                    <td class="py-3">
                        <v-chip :color="schedule.is_active ? 'success' : 'default'" variant="tonal" size="small">
                            {{ schedule.is_active ? 'Active' : 'Inactive' }}
                        </v-chip>
                    </td>
                    <td class="py-3 text-right">
                        <v-btn v-if="can('schedule.edit')" icon="mdi-pencil-outline" variant="text" size="small"
                            color="secondary" density="comfortable" @click="openEdit(schedule)" />
                        <v-btn v-if="can('schedule.delete')" icon="mdi-delete-outline" variant="text" size="small"
                            color="error" density="comfortable" @click="openDelete(schedule)" />
                    </td>
                </tr>
            </tbody>
        </v-table>

        <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
                Showing {{ paginatedSchedules.length }} of {{ schedules.length }} schedules
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
        <ScheduleModal :loading="actionLoading" :mode="modalMode" :schedule="selectedSchedule" :schedules="schedules"
            @submit="handleSubmit" @cancel="closeModal" />
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" :timeout="3000">
        {{ snackbarMsg }}
        <template #actions>
            <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
        </template>
    </v-snackbar>
</template>