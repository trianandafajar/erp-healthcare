<script setup lang="ts">
const workspace = useReceptionistWorkspace()
const recentQueue = computed(() => workspace.queue.value.slice(0, 4))
const recentAppointments = computed(() => workspace.appointments.value.slice(0, 5))

const statCards = computed(() => [
    {
        title: 'Today Registrations',
        value: workspace.summary.value.registeredToday.toString(),
        caption: 'New patients created',
        to: '/receptionist/patients/register',
        icon: 'mdi-account-plus-outline',
        color: 'primary',
    },
    {
        title: 'Appointment',
        value: workspace.summary.value.appointmentsToday.toString(),
        caption: 'Scheduled visits today',
        to: '/receptionist/appointments',
        icon: 'mdi-calendar-clock-outline',
        color: 'secondary',
    },
    {
        title: 'Check-in',
        value: workspace.summary.value.checkedIn.toString(),
        caption: 'Patients already arrived',
        to: '/receptionist/check-in',
        icon: 'mdi-clipboard-check-outline',
        color: 'success',
    },
    {
        title: 'Active Queue',
        value: workspace.summary.value.activeQueue.toString(),
        caption: 'Menunggu atau sedang dilayani',
        to: '/receptionist/queue',
        icon: 'mdi-format-list-numbered',
        color: 'warning',
    },
    {
        title: 'Available Doctors',
        value: workspace.summary.value.doctorsAvailable.toString(),
        caption: 'Available or limited schedules',
        to: '/receptionist/doctor-schedules',
        icon: 'mdi-doctor',
        color: 'info',
    },
    {
        title: 'Selesai',
        value: workspace.summary.value.completed.toString(),
        caption: 'Completed visits today',
        to: '/receptionist/appointments',
        icon: 'mdi-check-circle-outline',
        color: 'success',
    },
])

function appointmentStatusColor(status: string) {
    if (status === 'Completed') return 'success'
    if (status === 'Cancelled') return 'error'
    if (status === 'Checked In' || status === 'Waiting') return 'primary'
    return 'secondary'
}

function queueStatusColor(status: string) {
    if (status === 'Done') return 'success'
    if (status === 'Skipped') return 'error'
    if (status === 'In Service') return 'primary'
    if (status === 'Called') return 'info'
    return 'warning'
}
</script>

<template>
    <v-card-text class="py-6">
        <div class="d-flex flex-wrap align-center justify-space-between ga-4">
            <div>
                <div class="text-caption text-medium-emphasis text-uppercase">Receptionist Dashboard</div>
                <h3 class="text-h3 mb-2">Front desk operations</h3>
                <p class="text-body-1 text-medium-emphasis mb-0">
                    Manage patient registration, appointments, check-in, queue, billing, and doctor schedules from one workspace.
                </p>
            </div>
            <div class="d-flex ga-3 flex-wrap">
                <v-btn color="primary" variant="flat" to="/receptionist/check-in">Check-in patient</v-btn>
                <v-btn color="secondary" variant="tonal" to="/receptionist/queue/print">Print queue</v-btn>
            </div>
        </div>
    </v-card-text>

    <v-row>
        <v-col v-for="card in statCards" :key="card.title" cols="12" sm="6" lg="4">
            <v-card elevation="0" :to="card.to" class="h-100 receptionist-stat-card">
                <v-card-text class="d-flex flex-column ga-2">
                    <div class="d-flex align-center justify-space-between">
                        <div class="text-caption text-medium-emphasis text-uppercase">{{ card.title }}</div>
                        <v-avatar size="34" :color="card.color" variant="tonal">
                            <v-icon :icon="card.icon" size="19" />
                        </v-avatar>
                    </div>
                    <div class="text-h3 font-weight-bold">{{ card.value }}</div>
                    <div class="text-body-2 text-medium-emphasis">{{ card.caption }}</div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>

    <v-row class="mt-4">
        <v-col cols="12" lg="7">
            <v-card elevation="0" class="h-100">
                <v-card-item class="pb-2">
                    <v-card-title class="text-h5">Appointment Hari Ini</v-card-title>
                    <v-card-subtitle>Visits that need receptionist monitoring</v-card-subtitle>
                </v-card-item>
                <v-divider />
                <v-table hover density="comfortable">
                    <thead class="bg-containerBg">
                        <tr>
                            <th class="text-left text-caption font-weight-bold text-uppercase">Patient</th>
                            <th class="text-left text-caption font-weight-bold text-uppercase">Schedule</th>
                            <th class="text-left text-caption font-weight-bold text-uppercase">Doctor</th>
                            <th class="text-left text-caption font-weight-bold text-uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in recentAppointments" :key="item.id">
                            <td class="py-3">
                                <div class="text-body-2 font-weight-medium">{{ item.patientName }}</div>
                                <div class="text-caption text-medium-emphasis">{{ item.medicalRecordNumber }}</div>
                            </td>
                            <td class="py-3">
                                <div class="text-body-2">{{ item.appointmentTime }}</div>
                                <div class="text-caption text-medium-emphasis">{{ item.type }}</div>
                            </td>
                            <td class="py-3">
                                <div class="text-body-2">{{ item.doctorName }}</div>
                                <div class="text-caption text-medium-emphasis">{{ item.department }}</div>
                            </td>
                            <td class="py-3">
                                <v-chip size="small" variant="tonal" :color="appointmentStatusColor(item.status)">
                                    {{ item.status }}
                                </v-chip>
                            </td>
                        </tr>
                    </tbody>
                </v-table>
            </v-card>
        </v-col>

        <v-col cols="12" lg="5">
            <v-card elevation="0" class="h-100">
                <v-card-item class="pb-2">
                    <v-card-title class="text-h5">Active Queue</v-card-title>
                    <v-card-subtitle>Queue numbers currently in progress</v-card-subtitle>
                </v-card-item>
                <v-divider />
                <v-card-text class="d-flex flex-column ga-3">
                    <div v-for="item in recentQueue" :key="item.id" class="d-flex align-center justify-space-between ga-3">
                        <div class="d-flex align-center ga-3">
                            <v-avatar color="primary" variant="tonal" rounded="md">{{ item.queueNumber }}</v-avatar>
                            <div>
                                <div class="text-body-2 font-weight-medium">{{ item.patientName }}</div>
                                <div class="text-caption text-medium-emphasis">{{ item.department }} - {{ item.appointmentTime }}</div>
                            </div>
                        </div>
                        <v-chip size="small" variant="tonal" :color="queueStatusColor(item.status)">
                            {{ item.status }}
                        </v-chip>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>
</template>

<style scoped>
.receptionist-stat-card {
    transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.receptionist-stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}
</style>
