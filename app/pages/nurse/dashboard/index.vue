<script setup lang="ts">
import useNurseWorkspace from '~/composables/useNurseWorkspace'

definePageMeta({
    layout: 'nurse',
    middleware: 'auth',
})

useSeoMeta({
    title: 'Nurse Dashboard',
    ogTitle: 'Nurse Dashboard',
    description: 'Overview of the nurse daily workflow and patient care.',
    ogDescription: 'Overview of the nurse daily workflow and patient care.',
    twitterCard: 'summary_large_image',
})

const workspace = useNurseWorkspace()

const priorityPatients = computed(() => workspace.patients.value.filter(Boolean))
const recentMonitoring = computed(() => workspace.monitoringItems.value.filter(Boolean))

const featureCards = computed(() => [
    {
        title: 'Patients',
        value: workspace.summary.value.patientCount.toString(),
        caption: 'Active patients under care',
        to: '/nurse/patients',
        color: 'primary',
    },
    {
        title: 'Vital Signs',
        value: workspace.summary.value.vitalCount.toString(),
        caption: 'Blood pressure, temperature, weight, height, and pulse',
        to: '/nurse/vitals',
        color: 'error',
    },
    {
        title: 'Care Notes',
        value: workspace.summary.value.noteCount.toString(),
        caption: 'Progress notes and shift observations',
        to: '/nurse/care-notes',
        color: 'secondary',
    },
    {
        title: 'Procedure Schedule',
        value: workspace.summary.value.procedureCount.toString(),
        caption: 'Planned procedures and priorities',
        to: '/nurse/procedures',
        color: 'info',
    },
    {
        title: 'Patient Monitoring',
        value: workspace.summary.value.monitoringCount.toString(),
        caption: `${workspace.summary.value.urgentCount} need immediate attention`,
        to: '/nurse/monitoring',
        color: 'warning',
    },
])

function formatRelativeTime(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`

    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
    <v-row>
        <v-col cols="12">
            <v-card elevation="0" class="mb-6">
                <v-card-text class="py-6">
                    <div class="d-flex flex-wrap align-center justify-space-between ga-4">
                        <div>
                            <div class="text-caption text-medium-emphasis text-uppercase">Nurse Dashboard</div>
                            <h3 class="text-h3 mb-2">Daily care workflow</h3>
                            <p class="text-body-1 text-medium-emphasis mb-0">
                                Focus on patients, vital signs, care notes, procedure schedules, and monitoring.
                            </p>
                        </div>
                        <div class="d-flex ga-3 flex-wrap">
                            <v-btn color="primary" variant="flat" to="/nurse/vitals">Add Vitals</v-btn>
                            <v-btn color="secondary" variant="tonal" to="/nurse/care-notes">Add Note</v-btn>
                        </div>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>

    <v-row>
        <v-col v-for="card in featureCards" :key="card.title" cols="12" sm="6" lg="4">
            <v-card elevation="0" :to="card.to" class="h-100">
                <v-card-text class="d-flex flex-column ga-2">
                    <div class="text-caption text-medium-emphasis text-uppercase">{{ card.title }}</div>
                    <div class="text-h3 font-weight-bold">{{ card.value }}</div>
                    <div class="text-body-2 text-medium-emphasis">{{ card.caption }}</div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>

    <v-row class="mt-4">
        <v-col cols="12" lg="7">
            <v-card elevation="0">
                <v-card-item class="pb-2">
                    <v-card-title class="text-h5">Priority Patients</v-card-title>
                    <v-card-subtitle>Patients currently under close observation</v-card-subtitle>
                </v-card-item>

                <v-divider />

                <v-table hover density="comfortable">
                    <thead class="bg-containerBg">
                        <tr>
                            <th class="text-left text-caption font-weight-bold text-uppercase">Patient</th>
                            <th class="text-left text-caption font-weight-bold text-uppercase">Room</th>
                            <th class="text-left text-caption font-weight-bold text-uppercase">Status</th>
                            <th class="text-right text-caption font-weight-bold text-uppercase">Updated</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="patient in priorityPatients" :key="patient.id">
                            <td class="py-3">
                                <div class="text-body-2 font-weight-medium">{{ patient.name }}</div>
                                <div class="text-caption text-medium-emphasis">{{ patient.mrn }}</div>
                            </td>
                            <td class="py-3">{{ patient.department }} - {{ patient.room }}</td>
                            <td class="py-3">
                                <v-chip size="small" variant="tonal" :color="patient.status === 'critical' ? 'error' : patient.status === 'watch' ? 'warning' : 'success'">
                                    {{ patient.status }}
                                </v-chip>
                            </td>
                            <td class="py-3 text-right text-caption text-medium-emphasis">
                                {{ formatRelativeTime(patient.lastUpdated) }}
                            </td>
                        </tr>
                    </tbody>
                </v-table>
            </v-card>
        </v-col>

        <v-col cols="12" lg="5">
            <v-card elevation="0" class="mb-4">
                <v-card-item class="pb-2">
                    <v-card-title class="text-h5">Today's Tasks</v-card-title>
                    <v-card-subtitle>Shift checklist</v-card-subtitle>
                </v-card-item>

                <v-divider />

                <v-card-text class="d-flex flex-column ga-3">
                    <v-chip v-for="task in ['Patient list', 'Vital sign entry', 'Care notes', 'Procedure schedule', 'Patient monitoring']" :key="task" variant="tonal" color="primary" label>
                        {{ task }}
                    </v-chip>
                </v-card-text>
            </v-card>

            <v-card elevation="0">
                <v-card-item class="pb-2">
                    <v-card-title class="text-h5">Latest Updates</v-card-title>
                    <v-card-subtitle>Recent activity in the care area</v-card-subtitle>
                </v-card-item>

                <v-divider />

                <v-card-text class="d-flex flex-column ga-4">
                    <div v-for="item in recentMonitoring" :key="item.id" class="d-flex align-center justify-space-between ga-3">
                        <div>
                            <div class="text-body-2 font-weight-medium">{{ item.patientName }}</div>
                            <div class="text-caption text-medium-emphasis">{{ item.observation }}</div>
                        </div>
                        <v-chip size="small" variant="tonal" :color="item.status === 'Urgent' ? 'error' : item.status === 'Observe' ? 'warning' : 'success'">
                            {{ item.status }}
                        </v-chip>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>
</template>


