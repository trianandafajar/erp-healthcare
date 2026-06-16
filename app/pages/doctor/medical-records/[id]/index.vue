<script setup lang="ts">
import { computed } from 'vue'
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue'

definePageMeta({
    layout: 'doctor',
    middleware: 'auth'
})

useSeoMeta({
    title: 'Medical Record Detail Page',
    ogTitle: 'My Amazing Site',
    description: 'This is my amazing site, let me tell you all about it.',
    ogDescription: 'This is my amazing site, let me tell you all about it.',
    ogImage: 'https://example.com/image.png',
    twitterCard: 'summary_large_image',
})

const route = useRoute()
const id = route.params.id as string

const { data, pending } = await useFetch<{
    medical_record: any
}>(`/api/doctor/medical-records/${id}`)

const record = computed(() => data.value?.medical_record)

function formatDate(dateStr?: string) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    })
}

function formatTime(timeStr?: string) {
    if (!timeStr) return '-'
    return timeStr.slice(0, 5)
}
</script>

<template>
    <UiTitleCard class-name="pa-6">
        <div v-if="pending" class="text-center py-10">
            <v-progress-circular indeterminate color="primary" />
        </div>

        <div v-else-if="!record" class="text-center py-10 text-medium-emphasis">
            <v-icon icon="mdi-alert-circle-outline" size="40" class="mb-2" />
            Data not found
        </div>

        <div v-else>
            <div class="d-flex justify-space-between align-center mb-6">
                <div class="d-flex align-center ga-3">
                    <v-btn icon="mdi-arrow-left" variant="text" @click="navigateTo('/doctor/medical-records')" />

                    <div>
                        <div class="text-h6 font-weight-bold">
                            Medical Record Detail
                        </div>

                        <div class="text-caption text-medium-emphasis">
                            MRN: {{ record.patients?.medical_record_number }}
                        </div>
                    </div>
                </div>

                <v-chip color="success" variant="tonal">
                    {{ record.appointments?.status }}
                </v-chip>

            </div>

            <v-card class="pa-4 mb-4" variant="outlined">
                <div class="text-subtitle-2 mb-3">Patient Information</div>

                <div class="d-grid gap-2">
                    <div><strong>Name:</strong> {{ record.patients?.full_name }}</div>
                    <div><strong>Gender:</strong> {{ record.patients?.gender }}</div>
                    <div><strong>Patient ID:</strong> {{ record.patient_id }}</div>
                </div>
            </v-card>

            <v-card class="pa-4 mb-4" variant="outlined">
                <div class="text-subtitle-2 mb-3">Appointment</div>

                <div class="d-grid gap-2">
                    <div>
                        <strong>Date:</strong>
                        {{ formatDate(record.appointments?.appointment_date) }}
                    </div>

                    <div>
                        <strong>Time:</strong>
                        {{ formatTime(record.appointments?.appointment_time) }}
                    </div>

                    <div>
                        <strong>Type:</strong>
                        {{ record.appointments?.type }}
                    </div>
                </div>
            </v-card>

            <v-card class="pa-4 mb-4" variant="outlined">
                <div class="text-subtitle-2 mb-3">Vital Signs</div>

                <div class="d-grid gap-2">
                    <div><strong>Blood Pressure:</strong> {{ record.blood_pressure }} mmHg</div>
                    <div><strong>Heart Rate:</strong> {{ record.heart_rate }} bpm</div>
                    <div><strong>Temperature:</strong> {{ record.temperature }} °C</div>
                    <div><strong>Weight:</strong> {{ record.weight }} kg</div>
                    <div><strong>Height:</strong> {{ record.height }} cm</div>
                </div>
            </v-card>

            <v-card class="pa-4 mb-4" variant="outlined">
                <div class="text-subtitle-2 mb-3">Clinical Notes</div>

                <div class="mb-2">
                    <strong>Subjective:</strong>
                    <div>{{ record.subjective }}</div>
                </div>

                <div class="mb-2">
                    <strong>Objective:</strong>
                    <div>{{ record.objective }}</div>
                </div>

                <div class="mb-2">
                    <strong>Diagnosis:</strong>
                    <div>{{ record.diagnosis }}</div>
                </div>

                <div class="mb-2">
                    <strong>ICD-10:</strong>
                    <div>{{ record.icd10_code }}</div>
                </div>

                <div>
                    <strong>Treatment Plan:</strong>
                    <div>{{ record.treatment_plan }}</div>
                </div>
            </v-card>

            <v-card class="pa-4" variant="outlined">
                <div class="text-subtitle-2 mb-3">Doctor Notes</div>
                <div>{{ record.notes }}</div>
            </v-card>

        </div>
    </UiTitleCard>

    <UiTitleCard class-name="px-0 pb-0 rounded-md mt-4">
        <v-card-item class="pb-2">
            <v-card-title class="text-subtitle-1">
                Prescriptions
            </v-card-title>

            <v-card-subtitle>
                Medication prescribed for this patient
            </v-card-subtitle>
        </v-card-item>

        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-left text-caption font-weight-bold text-uppercase">
                        Medication
                    </th>

                    <th class="text-left text-caption font-weight-bold text-uppercase">
                        Dosage
                    </th>

                    <th class="text-left text-caption font-weight-bold text-uppercase">
                        Frequency
                    </th>

                    <th class="text-left text-caption font-weight-bold text-uppercase">
                        Duration
                    </th>

                    <th class="text-left text-caption font-weight-bold text-uppercase">
                        Instructions
                    </th>
                </tr>
            </thead>

            <tbody>
                <tr v-if="!record.prescriptions?.length">
                    <td colspan="5" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-pill" size="32" class="mb-2 d-block mx-auto" />
                        No prescriptions found
                    </td>
                </tr>

                <tr v-for="prescription in record.prescriptions" :key="prescription.id">
                    <td class="py-3">
                        <div class="font-weight-medium">
                            {{ prescription.medication_name }}
                        </div>
                    </td>

                    <td class="py-3">
                        <v-chip size="small" label color="primary" variant="tonal">
                            {{ prescription.dosage }} mg
                        </v-chip>
                    </td>

                    <td class="py-3">
                        <v-chip size="small" label color="success" variant="tonal">
                            {{ prescription.frequency }}x/day
                        </v-chip>
                    </td>

                    <td class="py-3">
                        {{ prescription.duration }} days
                    </td>

                    <td class="py-3">
                        {{ prescription.instructions }}
                    </td>
                </tr>
            </tbody>
        </v-table>
    </UiTitleCard>
</template>