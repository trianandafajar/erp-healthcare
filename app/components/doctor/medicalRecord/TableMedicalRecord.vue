<script setup lang="ts">
import { ref, computed } from 'vue'
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue'

definePageMeta({ middleware: ['auth'] })

interface MedicalRecord {
    id: string
    diagnosis: string | null
    icd10_code: string | null
    created_at: string

    patients: {
        id: string
        full_name: string
        medical_record_number: string
    } | null
}

const currentPage = ref(1)
const itemsPerPage = 10

const { data, pending, refresh } = await useFetch<{
    medical_records: MedicalRecord[]
}>('/api/doctor/medical-records')

const medicalRecords = computed<MedicalRecord[]>(() =>
    data.value?.medical_records ?? []
)

const paginatedMedicalRecords = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    return medicalRecords.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() =>
    Math.ceil(medicalRecords.value.length / itemsPerPage)
)

function formatDate(dateStr?: string) {
    if (!dateStr) return '-'

    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
}

function openDetail(record: MedicalRecord) {
    navigateTo(`/medical-records/${record.id}`)
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <v-card-item class="pb-2 px-0 pt-0">
            <div class="d-flex justify-space-between align-center">
                <div>
                    <v-card-title class="text-h3">
                        Medical Records
                    </v-card-title>

                    <v-card-subtitle class="mt-1">
                        View and manage patient medical records
                    </v-card-subtitle>
                </div>
            </div>
        </v-card-item>
    </v-card-item>
    <UiTitleCard class-name="px-0 pb-0 rounded-md">
        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-left text-caption font-weight-bold text-uppercase">
                        Patient
                    </th>

                    <th class="text-left text-caption font-weight-bold text-uppercase">
                        Diagnosis
                    </th>

                    <th class="text-left text-caption font-weight-bold text-uppercase">
                        ICD-10
                    </th>

                    <th class="text-left text-caption font-weight-bold text-uppercase">
                        Date
                    </th>

                    <th class="text-right text-caption font-weight-bold text-uppercase">
                        Actions
                    </th>
                </tr>
            </thead>

            <tbody>
                <tr v-if="pending">
                    <td colspan="5" class="text-center py-8">
                        <v-progress-circular indeterminate color="primary" />
                    </td>
                </tr>

                <tr v-else-if="paginatedMedicalRecords.length === 0">
                    <td colspan="5" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-file-document-outline" size="32" class="mb-2 d-block mx-auto" />

                        No medical records found
                    </td>
                </tr>

                <tr v-else v-for="record in paginatedMedicalRecords" :key="record.id">
                    <td class="py-3">
                        <div class="d-flex align-center ga-3">
                            <v-avatar size="34" color="primary" variant="tonal">
                                <span class="text-caption font-weight-bold">
                                    {{
                                        getInitials(
                                            record.patients?.full_name ?? '?'
                                        )
                                    }}
                                </span>
                            </v-avatar>

                            <div>
                                <div class="text-body-2 font-weight-medium">
                                    {{ record.patients?.full_name ?? '-' }}
                                </div>

                                <div class="text-caption text-medium-emphasis">
                                    {{
                                        record.patients?.medical_record_number ??
                                        '-'
                                    }}
                                </div>
                            </div>
                        </div>
                    </td>

                    <td class="py-3">
                        {{ record.diagnosis ?? '-' }}
                    </td>

                    <td class="py-3">
                        <v-chip v-if="record.icd10_code" color="info" size="small" variant="tonal">
                            {{ record.icd10_code }}
                        </v-chip>

                        <span v-else>-</span>
                    </td>

                    <td class="py-3">
                        {{ formatDate(record.created_at) }}
                    </td>

                    <td class="py-3 text-right">
                        <v-btn icon="mdi-eye-outline" variant="text" size="small" color="primary"
                            @click="openDetail(record)" />
                    </td>
                </tr>
            </tbody>
        </v-table>

        <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
                Showing {{ paginatedMedicalRecords.length }}
                of {{ medicalRecords.length }} medical records
            </span>

            <v-pagination v-if="totalPages > 1" v-model="currentPage" :length="totalPages" density="compact"
                size="small" />
        </div>
    </UiTitleCard>
</template>