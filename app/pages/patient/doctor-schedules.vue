<script setup lang="ts">
definePageMeta({
    layout: 'patient',
    middleware: 'auth'
})

useSeoMeta({
    title: 'Doctor Schedules',
    description: 'Patient doctor schedules page',
})

const { doctorSchedules } = usePatientPortalMock()
const search = ref('')

const filteredSchedules = computed(() =>
    doctorSchedules.filter((item) => {
        const keyword = search.value.toLowerCase()
        return (
            item.doctor.toLowerCase().includes(keyword) ||
            item.specialty.toLowerCase().includes(keyword) ||
            item.department.toLowerCase().includes(keyword) ||
            item.day.toLowerCase().includes(keyword)
        )
    })
)
</script>

<template>
    <div class="d-flex justify-space-between align-center mb-6 flex-wrap ga-3">
        <div>
            <h2 class="text-h3 mb-1">Doctor Schedules</h2>
            <p class="text-medium-emphasis mb-0">Browse available doctors and choose the best schedule for your visit.</p>
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
                    <th>Doctor</th>
                    <th>Specialty</th>
                    <th>Department</th>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Slots</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in filteredSchedules" :key="item.id">
                    <td>{{ item.doctor }}</td>
                    <td>{{ item.specialty }}</td>
                    <td>{{ item.department }}</td>
                    <td>{{ item.day }}</td>
                    <td>{{ item.time }}</td>
                    <td>
                        <v-chip size="small" color="primary" variant="tonal">{{ item.slots }} slots</v-chip>
                    </td>
                </tr>
                <tr v-if="filteredSchedules.length === 0">
                    <td colspan="6" class="text-center py-6 text-medium-emphasis">No doctor schedule found.</td>
                </tr>
            </tbody>
        </v-table>
    </UiTitleCard>
</template>
