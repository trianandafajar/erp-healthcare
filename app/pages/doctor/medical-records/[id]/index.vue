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
</template>