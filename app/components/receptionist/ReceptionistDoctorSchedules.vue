<script setup lang="ts">
definePageMeta({
    middleware: ['auth'],
})

interface ScheduleRow {
    id: string
    day_of_week: number
    day_name: string
    start_time: string
    end_time: string
    max_patients: number | null
    booked: number
    remaining_slots: number
    doctor_id: string | null
    doctor_name: string
    specialization: string
    department_id: string | null
    department_name: string
}

const search = ref('')
const departmentFilter = ref('all')
const dayFilter = ref('all')

const { data, pending, error } = await useFetch<{ schedules: ScheduleRow[] }>('/api/doctor-schedules')

const schedules = computed(() => data.value?.schedules ?? [])

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const dayOptions = [
    { label: 'All Days', value: 'all' },
    ...DAY_NAMES.map((d, i) => ({ label: d, value: String(i) }))
]

const departmentOptions = computed(() => {
    const names = [...new Set(schedules.value.map((s) => s.department_name).filter(Boolean))]
    return ['all', ...names]
})

const filteredSchedules = computed(() => {
    const keyword = search.value.toLowerCase()
    return schedules.value.filter((item) => {
        const matchSearch =
            item.doctor_name.toLowerCase().includes(keyword) ||
            item.specialization.toLowerCase().includes(keyword) ||
            item.department_name.toLowerCase().includes(keyword) ||
            item.day_name.toLowerCase().includes(keyword)
        const matchDept = departmentFilter.value === 'all' || item.department_name === departmentFilter.value
        const matchDay = dayFilter.value === 'all' || String(item.day_of_week) === dayFilter.value
        return matchSearch && matchDept && matchDay
    })
})

const summary = computed(() => ({
    total: schedules.value.length,
    available: schedules.value.filter((s) => s.remaining_slots > 0).length,
    full: schedules.value.filter((s) => s.remaining_slots === 0).length,
}))

function slotColor(remaining: number, max: number | null) {
    if (!max) return 'secondary'
    const pct = remaining / max
    if (pct <= 0) return 'error'
    if (pct <= 0.3) return 'warning'
    return 'success'
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div>
            <v-card-title class="text-h3">Doctor Schedules</v-card-title>
            <v-card-subtitle class="mt-1">Browse available doctors and schedules for patient
                appointments</v-card-subtitle>
        </div>
    </v-card-item>

    <v-row class="mb-4">
        <v-col cols="12" sm="4">
            <v-card elevation="0" border rounded="lg">
                <v-card-text>
                    <div class="text-caption text-medium-emphasis">Total Schedules</div>
                    <div class="text-h4">{{ summary.total }}</div>
                </v-card-text>
            </v-card>
        </v-col>
        <v-col cols="12" sm="4">
            <v-card elevation="0" border rounded="lg">
                <v-card-text>
                    <div class="text-caption text-medium-emphasis">Available</div>
                    <div class="text-h4 text-success">{{ summary.available }}</div>
                </v-card-text>
            </v-card>
        </v-col>
        <v-col cols="12" sm="4">
            <v-card elevation="0" border rounded="lg">
                <v-card-text>
                    <div class="text-caption text-medium-emphasis">Full</div>
                    <div class="text-h4 text-error">{{ summary.full }}</div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>

    <UiTitleCard class-name="px-0 pb-0 rounded-md">
        <div class="px-4 py-3">
            <v-row dense>
                <v-col cols="12" md="5">
                    <v-text-field v-model="search" placeholder="Search doctor, specialty, department, or day"
                        prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                    <v-select v-model="departmentFilter" :items="departmentOptions" label="Department"
                        variant="outlined" density="compact" hide-details />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                    <v-select v-model="dayFilter" :items="dayOptions" item-title="label" item-value="value" label="Day"
                        variant="outlined" density="compact" hide-details />
                </v-col>
            </v-row>
            <div class="text-caption text-medium-emphasis mt-3">
                Showing {{ filteredSchedules.length }} of {{ schedules.length }} schedules
            </div>
        </div>

        <v-divider />

        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Doctor</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Department</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Day</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Time</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Slots</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending">
                    <td colspan="5" class="text-center py-8">
                        <v-progress-circular indeterminate color="primary" />
                    </td>
                </tr>
                <tr v-else-if="error">
                    <td colspan="5" class="text-center py-8 text-medium-emphasis">Failed to load schedules.</td>
                </tr>
                <tr v-else-if="filteredSchedules.length === 0">
                    <td colspan="5" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-calendar-remove-outline" size="32" class="mb-2 d-block mx-auto" />
                        No schedules found
                    </td>
                </tr>
                <tr v-else v-for="item in filteredSchedules" :key="item.id">
                    <td class="py-3">
                        <div class="text-body-2 font-weight-medium">{{ item.doctor_name }}</div>
                        <div class="text-caption text-medium-emphasis">{{ item.specialization }}</div>
                    </td>
                    <td class="py-3 text-body-2">{{ item.department_name }}</td>
                    <td class="py-3 text-body-2">{{ item.day_name }}</td>
                    <td class="py-3 text-body-2">
                        {{ item.start_time.slice(0, 5) }} - {{ item.end_time.slice(0, 5) }}
                    </td>
                    <td class="py-3">
                        <div class="d-flex align-center ga-2">
                            <v-progress-linear
                                :model-value="item.max_patients ? ((item.max_patients - item.remaining_slots) / item.max_patients) * 100 : 0"
                                height="8" rounded :color="slotColor(item.remaining_slots, item.max_patients)"
                                style="width: 80px" />
                            <v-chip size="small" variant="tonal"
                                :color="slotColor(item.remaining_slots, item.max_patients)">
                                {{ item.remaining_slots }} / {{ item.max_patients ?? 0 }}
                            </v-chip>
                        </div>
                    </td>
                </tr>
            </tbody>
        </v-table>
    </UiTitleCard>
</template>