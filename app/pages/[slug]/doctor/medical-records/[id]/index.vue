<script setup lang="ts">
import { computed } from 'vue'
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue'

definePageMeta({
    layout: 'doctor',
    middleware: ['auth', 'permission'],
    permissions: ['medical.view'],
})

useSeoMeta({
    title: 'Medical Record Details',
    ogTitle: 'My Amazing Site',
    description: 'This is my amazing site, let me tell you all about it.',
    ogDescription: 'This is my amazing site, let me tell you all about it.',
    ogImage: 'https://example.com/image.png',
    twitterCard: 'summary_large_image',
})

const route = useRoute()
const slug = route.params.slug as string
const id = route.params.id as string

const { data, pending } = await useFetch<{
    medical_record: any
}>(`/api/doctor/medical-records/${id}`)

const record = computed(() => data.value?.medical_record)

const { data: attachmentData } = await useFetch<{
    files: any[]
}>(`/api/doctor/medical-record-files/${id}`)

const activeTab = ref('vitals')

const vitalItems = computed(() => [
    { label: 'Blood Pressure', value: record.value?.blood_pressure ?? '-', unit: 'mmHg', icon: 'mdi-blood-bag', color: 'error' },
    { label: 'Heart Rate', value: record.value?.heart_rate ?? '-', unit: 'bpm', icon: 'mdi-heart-pulse', color: 'pink' },
    { label: 'Temperature', value: record.value?.temperature ?? '-', unit: '°C', icon: 'mdi-thermometer', color: 'orange' },
    { label: 'Weight', value: record.value?.weight ?? '-', unit: 'kg', icon: 'mdi-weight-kilogram', color: 'blue' },
    { label: 'Height', value: record.value?.height ?? '-', unit: 'cm', icon: 'mdi-human-male-height', color: 'teal' },
])

const soapItems = computed(() => [
    { key: 'S', label: 'Subjective', value: record.value?.subjective, color: 'primary' },
    { key: 'O', label: 'Objective', value: record.value?.objective, color: 'info' },
    { key: 'A', label: 'Assessment / Diagnosis', value: record.value?.diagnosis, color: 'error' },
    { key: 'P', label: 'Treatment Plan', value: record.value?.treatment_plan, color: 'success' },
])

function prescriptionStatusColor(status: string) {
    const map: Record<string, string> = {
        Pending: 'warning',
        Verified: 'info',
        Dispensed: 'success',
        Rejected: 'error',
    }
    return map[status] ?? 'secondary'
}

const attachments = computed(
    () => attachmentData.value?.files ?? []
)

async function viewFile(fileId: string) {
    const res = await $fetch<{ url: string }>(
        `/api/doctor/medical-record-files/${fileId}/url`
    )

    window.open(res.url, '_blank')
}

function formatFileSize(bytes?: number) {
    if (!bytes) return '-'

    const kb = bytes / 1024

    if (kb < 1024) {
        return `${kb.toFixed(1)} KB`
    }

    return `${(kb / 1024).toFixed(1)} MB`
}

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
    <div v-if="pending" class="text-center py-10">
        <v-progress-circular indeterminate color="primary" />
    </div>

    <div v-else-if="!record" class="text-center py-10 text-medium-emphasis">
        <v-icon icon="mdi-alert-circle-outline" size="40" class="mb-2" />
        Data not found
    </div>

    <template v-else>
        <!-- Header -->
        <v-card variant="flat" class="mb-4">
            <v-card-item>
                <div class="d-flex justify-space-between align-center">
                    <div class="d-flex align-center ga-3">
                        <v-btn icon="mdi-arrow-left" variant="text"
                            @click="navigateTo(`/${slug}/doctor/medical-records`)" />
                        <div>
                            <div class="text-h6 font-weight-bold">Medical Record Detail</div>
                            <div class="text-caption text-medium-emphasis">
                                MRN: {{ record.patients?.medical_record_number }}
                            </div>
                        </div>
                    </div>

                    <div class="d-flex align-center ga-2">
                        <v-chip color="success" variant="tonal" prepend-icon="mdi-check-circle-outline">
                            {{ record.appointments?.status }}
                        </v-chip>
                    </div>
                </div>
            </v-card-item>
        </v-card>

        <!-- Patient Summary Banner -->
        <v-card class="mb-4" color="primary" variant="tonal">
            <v-card-text>
                <div class="d-flex align-center ga-4">
                    <v-avatar size="52" color="primary" variant="tonal">
                        <v-icon icon="mdi-account" size="28" />
                    </v-avatar>
                    <div class="flex-grow-1">
                        <div class="text-h6 font-weight-bold">
                            {{ record.patients?.full_name }}
                        </div>
                        <div class="text-caption text-medium-emphasis">
                            {{ record.patients?.gender }} ·
                            {{ formatDate(record.appointments?.appointment_date) }} ·
                            {{ formatTime(record.appointments?.appointment_time) }}
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-caption text-medium-emphasis">Appointment Type</div>
                        <v-chip size="small" variant="tonal" color="secondary">
                            {{ record.appointments?.type ?? '-' }}
                        </v-chip>
                    </div>
                </div>
            </v-card-text>
        </v-card>

        <!-- Tabs -->
        <v-card variant="flat">
            <v-tabs v-model="activeTab" color="primary" density="comfortable">
                <v-tab value="vitals" prepend-icon="mdi-heart-pulse">Vital Signs</v-tab>
                <v-tab value="soap" prepend-icon="mdi-stethoscope">SOAP Notes</v-tab>
                <v-tab value="prescriptions" prepend-icon="mdi-pill">
                    Prescriptions
                    <v-chip class="ml-2" size="x-small" color="primary" variant="tonal">
                        {{ record.prescriptions?.length ?? 0 }}
                    </v-chip>
                </v-tab>
                <v-tab value="attachments" prepend-icon="mdi-paperclip">
                    Attachments
                    <v-chip class="ml-2" size="x-small" color="primary" variant="tonal">
                        {{ attachments.length }}
                    </v-chip>
                </v-tab>
            </v-tabs>

            <v-divider />

            <v-window v-model="activeTab">

                <!-- Vital Signs -->
                <v-window-item value="vitals">
                    <v-card-text>
                        <v-row>
                            <v-col v-for="vital in vitalItems" :key="vital.label" cols="6" md="">
                                <v-card :style="{ borderColor: '#e0e0e0' }" variant="outlined" class="text-center pa-4"
                                    height="140">
                                    <v-icon :icon="vital.icon" :color="vital.color" size="28" class="mb-2" />
                                    <div class="text-h6 font-weight-bold">{{ vital.value }}</div>
                                    <div class="text-caption text-medium-emphasis">{{ vital.label }}</div>
                                    <div class="text-caption text-medium-emphasis">{{ vital.unit }}</div>
                                </v-card>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-window-item>

                <!-- SOAP Notes -->
                <v-window-item value="soap">
                    <v-card-text>
                        <v-row align="stretch">
                            <v-col v-for="soap in soapItems" :key="soap.key" cols="12" md="6">
                                <v-card :style="{ borderColor: '#e0e0e0' }" variant="outlined" class="fill-height">
                                    <v-card-item>
                                        <template #prepend>
                                            <v-avatar :color="soap.color" variant="tonal" size="36">
                                                <span class="text-caption font-weight-bold">{{ soap.key }}</span>
                                            </v-avatar>
                                        </template>
                                        <v-card-title class="text-body-1">{{ soap.label }}</v-card-title>
                                    </v-card-item>
                                    <v-divider />
                                    <v-card-text class="text-body-2">
                                        {{ soap.value || '-' }}
                                    </v-card-text>
                                </v-card>
                            </v-col>

                            <v-col cols="12" md="6">
                                <v-card :style="{ borderColor: '#e0e0e0' }" variant="outlined" class="fill-height">
                                    <v-card-item>
                                        <template #prepend>
                                            <v-avatar color="warning" variant="tonal" size="36">
                                                <v-icon icon="mdi-barcode" size="18" />
                                            </v-avatar>
                                        </template>
                                        <v-card-title class="text-body-1">ICD-10 Code</v-card-title>
                                    </v-card-item>
                                    <v-divider />
                                    <v-card-text>
                                        <v-chip v-if="record.icd10_code" color="warning" variant="tonal" label>
                                            {{ record.icd10_code }}
                                        </v-chip>
                                        <span v-else class="text-medium-emphasis">-</span>
                                    </v-card-text>
                                </v-card>
                            </v-col>

                            <v-col cols="12" md="6">
                                <v-card :style="{ borderColor: '#e0e0e0' }" variant="outlined" class="fill-height">
                                    <v-card-item>
                                        <template #prepend>
                                            <v-avatar color="secondary" variant="tonal" size="36">
                                                <v-icon icon="mdi-note-text-outline" size="18" />
                                            </v-avatar>
                                        </template>
                                        <v-card-title class="text-body-1">Clinical Notes</v-card-title>
                                    </v-card-item>
                                    <v-divider />
                                    <v-card-text class="text-body-2">
                                        {{ record.notes || '-' }}
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-window-item>

                <!-- Prescriptions -->
                <v-window-item value="prescriptions">
                    <v-table hover density="comfortable">
                        <thead class="bg-containerBg">
                            <tr>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Medication</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Dosage</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Frequency</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Duration</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Instructions</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="!record.prescriptions?.length">
                                <td colspan="6" class="text-center py-8 text-medium-emphasis">
                                    <v-icon icon="mdi-pill" size="32" class="mb-2 d-block mx-auto" />
                                    No prescriptions found
                                </td>
                            </tr>
                            <tr v-for="prescription in record.prescriptions" :key="prescription.id">
                                <td class="py-3 font-weight-medium">{{ prescription.medication_name }}</td>
                                <td class="py-3">
                                    <v-chip size="small" label color="primary" variant="tonal">
                                        {{ prescription.dosage }}
                                    </v-chip>
                                </td>
                                <td class="py-3">
                                    <v-chip size="small" label color="success" variant="tonal">
                                        {{ prescription.frequency }}
                                    </v-chip>
                                </td>
                                <td class="py-3">{{ prescription.duration }}</td>
                                <td class="py-3">{{ prescription.instructions }}</td>
                                <td class="py-3">
                                    <v-chip size="small" label variant="tonal"
                                        :color="prescriptionStatusColor(prescription.status)">
                                        {{ prescription.status }}
                                    </v-chip>
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-window-item>

                <!-- Attachments -->
                <v-window-item value="attachments">
                    <v-card-text v-if="!attachments.length" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-folder-open-outline" size="40" class="mb-2 d-block mx-auto" />
                        No attachments found
                    </v-card-text>

                    <v-table v-else hover density="comfortable">
                        <thead class="bg-containerBg">
                            <tr>
                                <th class="text-left">Document</th>
                                <th class="text-left">Category</th>
                                <th class="text-left">Type</th>
                                <th class="text-left">Size</th>
                                <th class="text-left">Uploaded</th>
                                <th class="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="file in attachments" :key="file.id">
                                <td class="py-3">
                                    <div class="d-flex align-center ga-3">
                                        <v-avatar size="40" color="primary" variant="tonal">
                                            <v-icon :icon="file.file_type?.includes('pdf')
                                                ? 'mdi-file-pdf-box'
                                                : 'mdi-file-image'" />
                                        </v-avatar>
                                        <div>
                                            <div class="font-weight-medium">{{ file.title }}</div>
                                            <div class="text-caption text-medium-emphasis">{{ file.file_name }}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-3">
                                    <v-chip size="small" variant="tonal" color="secondary">{{ file.category }}</v-chip>
                                </td>
                                <td class="py-3 text-caption">{{ file.file_type }}</td>
                                <td class="py-3 text-caption">{{ formatFileSize(file.file_size) }}</td>
                                <td class="py-3">{{ formatDate(file.created_at) }}</td>
                                <td class="text-right py-3">
                                    <v-btn color="primary" variant="tonal" prepend-icon="mdi-eye-outline" size="small"
                                        @click="viewFile(file.id)">
                                        View
                                    </v-btn>
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-window-item>

            </v-window>
        </v-card>
    </template>
</template>
