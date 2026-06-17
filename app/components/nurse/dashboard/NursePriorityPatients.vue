<script setup lang="ts">
type PatientOverviewItem = {
    id: string
    name: string
    mrn: string
    room: string
    status: 'Stable' | 'Watch' | 'Critical'
    lastUpdate: string
}

defineProps<{
    patients: PatientOverviewItem[]
    loading: boolean
}>()

function statusColor(status: PatientOverviewItem['status']) {
    if (status === 'Critical') return 'error'
    if (status === 'Watch') return 'warning'
    return 'success'
}

function formatRelativeTime(dateStr: string) {
    const date = new Date(dateStr)
    const diffMs = Date.now() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
    <v-card elevation="0">
        <v-card-item class="pb-2">
            <v-card-title class="text-h5">Priority Patients</v-card-title>
            <v-card-subtitle>Live patient snapshot from vitals and care activity</v-card-subtitle>
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
                <tr v-for="patient in patients.slice(0, 6)" :key="patient.id">
                    <td class="py-3">
                        <div class="text-body-2 font-weight-medium">{{ patient.name }}</div>
                        <div class="text-caption text-medium-emphasis">{{ patient.mrn }}</div>
                    </td>
                    <td class="py-3">{{ patient.room }}</td>
                    <td class="py-3">
                        <v-chip size="small" variant="tonal" :color="statusColor(patient.status)">
                            {{ patient.status }}
                        </v-chip>
                    </td>
                    <td class="py-3 text-right text-caption text-medium-emphasis">
                        {{ formatRelativeTime(patient.lastUpdate) }}
                    </td>
                </tr>
                <tr v-if="!loading && patients.length === 0">
                    <td colspan="4" class="py-8 text-center text-medium-emphasis">
                        No patient vitals available yet.
                    </td>
                </tr>
                <tr v-if="loading">
                    <td colspan="4" class="py-4">
                        <v-skeleton-loader type="table-row@4" />
                    </td>
                </tr>
            </tbody>
        </v-table>
    </v-card>
</template>
