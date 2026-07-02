<script setup lang="ts">
import { ref, computed } from 'vue'
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue'

definePageMeta({ middleware: ['auth'] })

const { can } = usePermission()
const route = useRoute()
const slug = computed(() => route.params.slug as string)

interface Examination {
    id: string
    appointment_date: string | null
    appointment_time: string | null
    queue_number: string | null
    status: string | null
    type: string | null
    chief_complaint: string | null

    patients: {
        id: string
        full_name: string
        medical_record_number: string
        gender?: string
    } | null
}

const currentPage = ref(1)
const itemsPerPage = 10

const { data, pending } = await useFetch<{
    examinations: Examination[]
}>('/api/doctor/examinations')

const examinations = computed<Examination[]>(() =>
    data.value?.examinations ?? []
)

const paginatedExaminations = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    return examinations.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() =>
    Math.ceil(examinations.value.length / itemsPerPage)
)

function formatDate(dateStr?: string | null) {
    if (!dateStr) return '-'

    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
}

function formatTime(timeStr?: string | null) {
    if (!timeStr) return '-'
    return timeStr.slice(0, 5)
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
}

function getQueueNumber(index: number) {
    return (currentPage.value - 1) * itemsPerPage + index + 1
}

function openExamination(record: Examination) {
    navigateTo(`/${slug.value}/doctor/examination/${record.id}`)
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex justify-space-between align-center">
            <div>
                <v-card-title class="text-h3">
                    Examinations
                </v-card-title>

                <v-card-subtitle class="mt-1">
                    Manage today patient examinations
                </v-card-subtitle>
            </div>
        </div>
    </v-card-item>

    <UiTitleCard class-name="px-0 pb-0 rounded-md">
        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-left text-caption font-weight-bold text-uppercase">
                        Queue
                    </th>

                    <th class="text-left text-caption font-weight-bold text-uppercase">
                        Time
                    </th>

                    <th class="text-left text-caption font-weight-bold text-uppercase">
                        Patient
                    </th>

                    <th class="text-left text-caption font-weight-bold text-uppercase">
                        MRN
                    </th>

                    <th class="text-left text-caption font-weight-bold text-uppercase">
                        Complaint
                    </th>

                    <th class="text-right text-caption font-weight-bold text-uppercase">
                        Actions
                    </th>
                </tr>
            </thead>

            <tbody>
                <tr v-if="pending">
                    <td colspan="6" class="text-center py-8">
                        <v-progress-circular indeterminate color="primary" />
                    </td>
                </tr>

                <tr v-else-if="paginatedExaminations.length === 0">
                    <td colspan="6" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-stethoscope" size="32" class="mb-2 d-block mx-auto" />
                        No examinations found
                    </td>
                </tr>

                <tr v-else v-for="(exam, index) in paginatedExaminations" :key="exam.id">
                    <td class="py-3">
                        {{ exam.queue_number ?? '-' }}
                    </td>

                    <td class="py-3">
                        <v-chip v-if="exam.appointment_time" color="info" size="small" variant="tonal">
                            {{ formatTime(exam.appointment_time) }}
                        </v-chip>
                        <span v-else>-</span>
                    </td>

                    <td class="py-3">
                        {{ exam.patients?.full_name ?? '-' }}
                    </td>

                    <td class="py-3">
                        {{ exam.patients?.medical_record_number ?? '-' }}
                    </td>

                    <td class="py-3">
                        {{ exam.chief_complaint ?? '-' }}
                    </td>

                    <td class="py-3 text-right">
                        <v-btn v-if="can('examination.create')" icon="mdi-stethoscope" variant="text" size="small"
                            color="primary" density="comfortable" @click="openExamination(exam)" />
                    </td>
                </tr>
            </tbody>
        </v-table>

        <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
                Showing {{ paginatedExaminations.length }}
                of {{ examinations.length }} examinations
            </span>

            <v-pagination v-if="totalPages > 1" v-model="currentPage" :length="totalPages" :total-visible="6"
                density="compact" size="small" />
        </div>
    </UiTitleCard>
</template>