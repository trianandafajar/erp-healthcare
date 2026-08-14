<script setup lang="ts">
definePageMeta({
    layout: 'patient',
    middleware: ['authorize'],
    permissions: ['doctor-schedule.view'],
})

useSeoMeta({
    title: 'Doctor Schedules',
    description: 'Patient doctor schedules page',
})

const search = ref('')

type ScheduleRow = {
    id: string
    doctor: string
    specialty: string
    department: string
    day: string
    time: string
    slots: number | null
}

const {
    data: schedulesResponse,
    pending,
    error,
} = await useFetch<{ schedules: Omit<ScheduleRow, 'doctor' | 'department' | 'slots'> & { doctorName: string; departmentName: string; maxPatients?: number }[] }>(
    '/api/patient/schedules',
    {
        transform: (res) => res,
    }
)

const schedules = computed<ScheduleRow[]>(() => {
    const raw = schedulesResponse.value?.schedules ?? []
    return raw.map((s: any) => ({
        id: String(s.id),
        day: String(s.day ?? ''),
        time: String(s.time ?? ''),
        doctor: String(s.doctorName ?? ''),
        specialty: String(s.specialty ?? ''),
        department: String(s.departmentName ?? ''),
        slots: typeof s.maxPatients === 'number' ? s.maxPatients : null,
    }))
})

const filteredSchedules = computed(() => {
    const keyword = search.value.toLowerCase().trim()
    if (!keyword) return schedules.value

    return schedules.value.filter((item) =>
        item.doctor.toLowerCase().includes(keyword) ||
        item.specialty.toLowerCase().includes(keyword) ||
        item.department.toLowerCase().includes(keyword) ||
        item.day.toLowerCase().includes(keyword)
    )
})
</script>

<template>
    <div class="d-flex justify-space-between align-center mb-6 flex-wrap ga-3">
        <div>
            <h2 class="text-h3 mb-1">Doctor Schedules</h2>
            <p class="text-medium-emphasis mb-0">Browse available doctors and choose the best schedule for your visit.
            </p>
        </div>
    </div>

    <UiTitleCard class-name="px-0 pb-0 rounded-md" title="Practice Schedule">
        <div class="px-4 py-3">
            <v-text-field v-model="search" placeholder="Search by doctor, specialty, department, or day"
                prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable
                style="max-width: 380px" />
        </div>

        <v-table class="text-no-wrap">
            <thead>
                <tr>
                    <th class="text-no-wrap">Doctor</th>
                    <th class="text-no-wrap">Specialty</th>
                    <th class="text-no-wrap">Department</th>
                    <th class="text-no-wrap">Day</th>
                    <th class="text-no-wrap">Time</th>
                    <th class="text-no-wrap">Slots</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending">
                    <td colspan="6" class="text-center py-6 text-medium-emphasis">Loading schedules...</td>
                </tr>

                <tr v-else-if="error">
                    <td colspan="6" class="text-center py-6 text-medium-emphasis">Failed to load schedules.</td>
                </tr>

                <tr v-else v-for="item in filteredSchedules" :key="item.id">
                    <td>{{ item.doctor }}</td>
                    <td>{{ item.specialty }}</td>
                    <td>{{ item.department }}</td>
                    <td>{{ item.day }}</td>
                    <td>{{ item.time }}</td>
                    <td>
                        <v-chip size="small" color="primary" variant="tonal">{{ item.slots ?? 0 }} slots</v-chip>
                    </td>
                </tr>

                <tr v-if="!pending && !error && filteredSchedules.length === 0">
                    <td colspan="6" class="text-center py-6 text-medium-emphasis">No doctor schedule found.</td>
                </tr>
            </tbody>
        </v-table>
    </UiTitleCard>
</template>
