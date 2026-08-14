<script setup lang="ts">
definePageMeta({
    layout: 'doctor',
    middleware: ['authorize'],
    permissions: ['patient-history.view'],
})

useSeoMeta({
    title: 'Patient History Details',
    ogTitle: 'My Amazing Site',
    description: 'This is my amazing site, let me tell you all about it.',
    ogDescription: 'This is my amazing site, let me tell you all about it.',
    ogImage: 'https://example.com/image.png',
    twitterCard: 'summary_large_image',
})

interface TimelineItem {
    type: 'appointment' | 'medical_record' | 'referral'
    id: string
    timestamp: string
    title: string
    description: string | null
    doctor_name: string | null
    department_name?: string | null
    status: string | null
    prescription_count?: number
}

const route = useRoute()
const slug = route.params.slug as string
const patientId = route.params.id as string

const { data, pending } = await useFetch<{ timeline: TimelineItem[] }>(
    `/api/doctor/patients/${patientId}/history`
)

const timeline = computed(() => data.value?.timeline ?? [])

const typeConfig: Record<string, { icon: string; color: string }> = {
    appointment: { icon: 'mdi-calendar-clock', color: 'info' },
    medical_record: { icon: 'mdi-stethoscope', color: 'primary' },
    referral: { icon: 'mdi-share-variant', color: 'secondary' },
}

const statusColors: Record<string, string> = {
    waiting: 'warning',
    in_progress: 'info',
    done: 'success',
    cancelled: 'error',
    pending: 'warning',
    accepted: 'info',
    completed: 'success',
    rejected: 'error',
}

function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
</script>

<template>
    <v-row>
        <v-col cols="12">
            <div class="d-flex align-center ga-2 mb-2">
                <v-btn icon="mdi-arrow-left" variant="text" size="large" :to="`/${slug}/doctor/patients/history`" />
                <div>
                    <v-card-title class="text-h3 pl-0">Patient Activity History</v-card-title>
                    <v-card-subtitle class="pl-0 mt-1">
                        Combined timeline of appointments, examinations, and referrals
                    </v-card-subtitle>
                </div>
            </div>
        </v-col>

        <v-col cols="12">
            <v-card>
                <v-card-text>
                    <div v-if="pending" class="text-center py-8">
                        <v-progress-circular indeterminate color="primary" />
                    </div>

                    <div v-else-if="timeline.length === 0" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-history" size="32" class="mb-2 d-block mx-auto" />
                        No activity recorded for this patient yet
                    </div>

                    <v-timeline v-else side="end" density="comfortable" truncate-line="both">
                        <v-timeline-item v-for="item in timeline" :key="`${item.type}-${item.id}`"
                            :dot-color="typeConfig[item.type]?.color ?? 'secondary'" size="small">
                            <template #icon>
                                <v-icon :icon="typeConfig[item.type]?.icon" size="14" color="white" />
                            </template>

                            <div class="d-flex justify-space-between align-start flex-wrap ga-2">
                                <div>
                                    <div class="text-body-1 font-weight-medium">{{ item.title }}</div>
                                    <div v-if="item.description" class="text-body-2 text-medium-emphasis mt-1">
                                        {{ item.description }}
                                    </div>
                                    <div class="text-caption text-medium-emphasis mt-1">
                                        <template v-if="item.doctor_name">
                                            dr. {{ item.doctor_name }}
                                        </template>
                                        <template v-if="item.department_name">
                                            · {{ item.department_name }}
                                        </template>
                                        <template v-if="item.prescription_count">
                                            · {{ item.prescription_count }} medicine(s) prescribed
                                        </template>
                                    </div>
                                </div>

                                <div class="text-right">
                                    <v-chip v-if="item.status" :color="statusColors[item.status] ?? 'secondary'"
                                        variant="tonal" size="small" class="text-capitalize mb-1">
                                        {{ item.status.replace('_', ' ') }}
                                    </v-chip>
                                    <div class="text-caption text-medium-emphasis">
                                        {{ formatDateTime(item.timestamp) }}
                                    </div>
                                </div>
                            </div>
                        </v-timeline-item>
                    </v-timeline>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>
</template>
