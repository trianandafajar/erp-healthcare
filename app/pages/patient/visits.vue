<script setup lang="ts">
definePageMeta({
    layout: 'patient',
    middleware: ['auth', 'permission'],
    permissions: ['visits.view'],
})

useSeoMeta({
    title: 'Visit History',
    description: 'Patient visit history page',
})

type Visit = {
    id: string
    date: string
    doctor: string
    department: string
    visitType: string
    complaint: string
    queueNumber: string | number
    status: string
    notes: string
    followUp: string
    vitalSigns: {
        bloodPressure: string
        heartRate: string
        temperature: string
    }
}

const { data } = await useFetch('/api/patient/visits')
const visits = computed(() => data.value?.visits ?? [])

const search = ref('')
const statusFilter = ref('all')
const detailDialog = ref(false)
const selectedVisit = ref<Visit | null>(null)

const filteredVisits = computed(() =>
    (visits.value as Visit[]).filter((item) => {
        const keyword = search.value.toLowerCase()
        const matchSearch =
            item.doctor.toLowerCase().includes(keyword) ||
            item.department.toLowerCase().includes(keyword) ||
            item.complaint.toLowerCase().includes(keyword) ||
            item.visitType.toLowerCase().includes(keyword)
        const matchStatus = statusFilter.value === 'all' || item.status === statusFilter.value
        return matchSearch && matchStatus
    })
)

function openDetail(item: Visit) {
    selectedVisit.value = item
    detailDialog.value = true
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
}

function statusColor(status: string) {
    return ({
        Completed: 'success',
        Scheduled: 'primary',
        Cancelled: 'error'
    } as Record<string, string>)[status] ?? 'secondary'
}
</script>

<template>
    <div class="d-flex justify-space-between align-center mb-6 flex-wrap ga-3">
        <div>
            <h2 class="text-h3 mb-1">Visit History</h2>
            <p class="text-medium-emphasis mb-0">Track your previous and upcoming clinical visits.</p>
        </div>
    </div>

    <UiTitleCard class-name="px-0 pb-0 rounded-md" title="Visit Records">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 px-4 py-3">
            <v-text-field v-model="search" placeholder="Search by doctor, department, complaint, or visit type"
                prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable
                style="max-width: 420px" />

            <v-btn-toggle v-model="statusFilter" mandatory density="compact" variant="tonal" color="primary">
                <v-btn value="all">All</v-btn>
                <v-btn value="Completed">Completed</v-btn>
                <v-btn value="Scheduled">Scheduled</v-btn>
                <v-btn value="Cancelled">Cancelled</v-btn>
            </v-btn-toggle>
        </div>

        <v-table class="text-no-wrap">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Doctor</th>
                    <th>Department</th>
                    <th>Visit Type</th>
                    <th>Complaint</th>
                    <th>Status</th>
                    <th class="text-right">Action</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in filteredVisits" :key="item.id">
                    <td>{{ formatDate(item.date) }}</td>
                    <td>{{ item.doctor }}</td>
                    <td>{{ item.department }}</td>
                    <td>{{ item.visitType }}</td>
                    <td class="text-wrap">{{ item.complaint }}</td>
                    <td>
                        <v-chip size="small" :color="statusColor(item.status)" variant="tonal">{{ item.status
                        }}</v-chip>
                    </td>
                    <td class="text-right">
                        <v-btn size="small" variant="text" color="primary" prepend-icon="mdi-eye-outline"
                            @click="openDetail(item)">
                            View Detail
                        </v-btn>
                    </td>
                </tr>
                <tr v-if="filteredVisits.length === 0">
                    <td colspan="7" class="text-center py-6 text-medium-emphasis">No visit history found.</td>
                </tr>
            </tbody>
        </v-table>
    </UiTitleCard>

    <v-dialog v-model="detailDialog" max-width="860">
        <v-card v-if="selectedVisit" rounded="lg">
            <v-card-item>
                <div class="d-flex justify-space-between align-start flex-wrap ga-3">
                    <div>
                        <v-card-title class="px-0">{{ selectedVisit.visitType }}</v-card-title>
                        <v-card-subtitle class="px-0 mt-1">
                            {{ selectedVisit.id }} | {{ selectedVisit.department }} | {{ selectedVisit.doctor }}
                        </v-card-subtitle>
                    </div>
                    <div class="d-flex flex-wrap ga-2">
                        <v-chip color="primary" variant="tonal">{{ formatDate(selectedVisit.date) }}</v-chip>
                        <v-chip :color="statusColor(selectedVisit.status)" variant="tonal">{{ selectedVisit.status
                        }}</v-chip>
                    </div>
                </div>
            </v-card-item>

            <v-card-text>
                <v-row>
                    <v-col cols="12" md="6">
                        <div class="text-caption text-medium-emphasis">Queue Number</div>
                        <div class="text-body-1 font-weight-medium">{{ selectedVisit.queueNumber }}</div>
                    </v-col>
                    <v-col cols="12" md="6">
                        <div class="text-caption text-medium-emphasis">Chief Complaint</div>
                        <div class="text-body-1 font-weight-medium">{{ selectedVisit.complaint }}</div>
                    </v-col>
                    <v-col cols="12">
                        <div class="text-caption text-medium-emphasis mb-1">Visit Notes</div>
                        <div class="text-body-2">{{ selectedVisit.notes }}</div>
                    </v-col>
                    <v-col cols="12">
                        <div class="text-caption text-medium-emphasis mb-2">Vital Signs</div>
                        <v-row>
                            <v-col cols="12" sm="4">
                                <v-card elevation="0" border rounded="lg">
                                    <v-card-text>
                                        <div class="text-caption text-medium-emphasis">Blood Pressure</div>
                                        <div class="text-body-1 font-weight-medium">{{
                                            selectedVisit.vitalSigns.bloodPressure }}</div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                            <v-col cols="12" sm="4">
                                <v-card elevation="0" border rounded="lg">
                                    <v-card-text>
                                        <div class="text-caption text-medium-emphasis">Heart Rate</div>
                                        <div class="text-body-1 font-weight-medium">{{
                                            selectedVisit.vitalSigns.heartRate }}</div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                            <v-col cols="12" sm="4">
                                <v-card elevation="0" border rounded="lg">
                                    <v-card-text>
                                        <div class="text-caption text-medium-emphasis">Temperature</div>
                                        <div class="text-body-1 font-weight-medium">{{
                                            selectedVisit.vitalSigns.temperature }}</div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>
                    </v-col>
                    <v-col cols="12">
                        <div class="text-caption text-medium-emphasis mb-1">Follow-up Guidance</div>
                        <v-alert color="info" variant="tonal" rounded="lg">
                            {{ selectedVisit.followUp }}
                        </v-alert>
                    </v-col>
                </v-row>
            </v-card-text>

            <v-card-actions class="px-6 pb-4">
                <v-spacer />
                <v-btn variant="text" @click="detailDialog = false">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
