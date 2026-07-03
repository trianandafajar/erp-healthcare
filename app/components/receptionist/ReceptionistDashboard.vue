<script setup lang="ts">
definePageMeta({
    middleware: ['auth'],
})

interface AppointmentRow {
    id: string
    appointment_date: string
    appointment_time: string | null
    type: string
    status: string
    queue_number: string | null
    updated_at: string
    patient: { id: string; full_name: string; medical_record_number: string } | null
    doctor: {
        id: string
        specialization: string | null
        profile: { id: string; full_name: string } | null
        department: { id: string; name: string } | null
    } | null
    department: { id: string; name: string } | null
}

const route = useRoute()
const slug = route.params.slug as string

const today = new Date().toISOString().slice(0, 10)

const { data: appointmentsData } = await useFetch<{ appointments: AppointmentRow[] }>('/api/appointments')
const { data: schedulesData } = await useFetch<{ schedules: any[] }>('/api/doctor-schedules')
const { data: patientsData } = await useFetch<{ patients: any[] }>('/api/patients')

const appointments = computed(() => appointmentsData.value?.appointments ?? [])
const schedules = computed(() => schedulesData.value?.schedules ?? [])
const patients = computed(() => patientsData.value?.patients ?? [])

const todayAppointments = computed(() =>
    appointments.value.filter((a) => a.appointment_date === today)
)

const summary = computed(() => ({
    registeredToday: patients.value.filter((p) => p.created_at?.slice(0, 10) === today).length,
    appointmentsToday: todayAppointments.value.length,
    checkedIn: todayAppointments.value.filter((a) => a.status === 'in_progress').length,
    activeQueue: todayAppointments.value.filter((a) => a.status === 'waiting' || a.status === 'in_progress').length,
    doctorsAvailable: schedules.value.filter((s) => s.remaining_slots > 0).length,
    completed: todayAppointments.value.filter((a) => a.status === 'done').length,
}))

const statCards = computed(() => [
    {
        title: 'Today Registrations',
        value: summary.value.registeredToday,
        caption: 'New patients created',
        to: `/${slug}/receptionist/patients/register`,
        icon: 'mdi-account-plus-outline',
        color: 'primary',
    },
    {
        title: 'Appointments',
        value: summary.value.appointmentsToday,
        caption: 'Scheduled visits today',
        to: `/${slug}/receptionist/appointments`,
        icon: 'mdi-calendar-clock-outline',
        color: 'secondary',
    },
    {
        title: 'Check-in',
        value: summary.value.checkedIn,
        caption: 'Patients already arrived',
        to: `/${slug}/receptionist/check-in`,
        icon: 'mdi-clipboard-check-outline',
        color: 'info',
    },
    {
        title: 'Active Queue',
        value: summary.value.activeQueue,
        caption: 'Waiting or in progress',
        to: `/${slug}/receptionist/queue`,
        icon: 'mdi-format-list-numbered',
        color: 'warning',
    },
    {
        title: 'Available Doctors',
        value: summary.value.doctorsAvailable,
        caption: 'Schedules with open slots',
        to: `/${slug}/receptionist/doctor-schedules`,
        icon: 'mdi-doctor',
        color: 'primary',
    },
    {
        title: 'Completed',
        value: summary.value.completed,
        caption: 'Completed visits today',
        to: `/${slug}/receptionist/appointments`,
        icon: 'mdi-check-circle-outline',
        color: 'success',
    },
])

const recentAppointments = computed(() => todayAppointments.value.slice(0, 5))

const recentQueue = computed(() =>
    todayAppointments.value
        .filter((a) => a.status === 'waiting' || a.status === 'in_progress')
        .slice(0, 4)
)

const statusColors: Record<string, string> = {
    waiting: 'warning',
    in_progress: 'primary',
    done: 'success',
    cancelled: 'error',
}

const typeLabels: Record<string, string> = {
    appointment: 'Appointment',
    walkin: 'Walk-in',
    referral: 'Referral',
    consultation: 'Consultation',
    follow_up: 'Follow-up',
}
</script>

<template>
    <v-card-text class="py-6">
        <div class="d-flex flex-wrap align-center justify-space-between ga-4">
            <div>
                <div class="text-caption text-medium-emphasis text-uppercase">Receptionist Dashboard</div>
                <h3 class="text-h3 mb-2">Front desk operations</h3>
                <p class="text-body-1 text-medium-emphasis mb-0">
                    Manage patient registration, appointments, check-in, queue, and doctor schedules from one workspace.
                </p>
            </div>
            <div class="d-flex ga-3 flex-wrap">
                <v-btn color="primary" variant="flat" :to="`/${slug}/receptionist/check-in`">Check-in patient</v-btn>
                <v-btn color="secondary" variant="tonal" :to="`/${slug}/receptionist/queue/print`">Print queue</v-btn>
            </div>
        </div>
    </v-card-text>

    <v-row>
        <v-col v-for="card in statCards" :key="card.title" cols="12" sm="6" lg="4">
            <v-card elevation="0" border :to="card.to" class="h-100 receptionist-stat-card">
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
            <v-card elevation="0" border class="h-100">
                <v-card-item class="pb-2">
                    <v-card-title class="text-h5">Today's Appointments</v-card-title>
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
                        <tr v-if="recentAppointments.length === 0">
                            <td colspan="4" class="text-center py-6 text-medium-emphasis">No appointments today</td>
                        </tr>
                        <tr v-else v-for="item in recentAppointments" :key="item.id">
                            <td class="py-3">
                                <div class="text-body-2 font-weight-medium">{{ item.patient?.full_name ?? '-' }}</div>
                                <div class="text-caption text-medium-emphasis">{{ item.patient?.medical_record_number ??
                                    '-' }}</div>
                            </td>
                            <td class="py-3">
                                <div class="text-body-2">{{ item.appointment_time?.slice(0, 5) ?? '-' }}</div>
                                <div class="text-caption text-medium-emphasis">{{ typeLabels[item.type] ?? item.type }}
                                </div>
                            </td>
                            <td class="py-3">
                                <div class="text-body-2">{{ item.doctor?.profile?.full_name ?? '-' }}</div>
                                <div class="text-caption text-medium-emphasis">
                                    {{ item.department?.name ?? item.doctor?.department?.name ?? '-' }}
                                </div>
                            </td>
                            <td class="py-3">
                                <v-chip size="small" variant="tonal" :color="statusColors[item.status] ?? 'default'">
                                    {{ item.status.replace('_', ' ') }}
                                </v-chip>
                            </td>
                        </tr>
                    </tbody>
                </v-table>
            </v-card>
        </v-col>

        <v-col cols="12" lg="5">
            <v-card elevation="0" border class="h-100">
                <v-card-item class="pb-2">
                    <v-card-title class="text-h5">Active Queue</v-card-title>
                    <v-card-subtitle>Queue numbers currently waiting or in progress</v-card-subtitle>
                </v-card-item>
                <v-divider />
                <v-card-text class="d-flex flex-column ga-3">
                    <div v-if="recentQueue.length === 0" class="text-center py-4 text-medium-emphasis">
                        No active queue
                    </div>
                    <div v-else v-for="item in recentQueue" :key="item.id"
                        class="d-flex align-center justify-space-between ga-3">
                        <div class="d-flex align-center ga-3">
                            <v-avatar color="primary" variant="tonal" rounded="md">
                                <span class="text-caption font-weight-bold">{{ item.queue_number ?? '-' }}</span>
                            </v-avatar>
                            <div>
                                <div class="text-body-2 font-weight-medium">{{ item.patient?.full_name ?? '-' }}</div>
                                <div class="text-caption text-medium-emphasis">
                                    {{ item.department?.name ?? item.doctor?.department?.name ?? '-' }}
                                    <template v-if="item.appointment_time"> · {{ item.appointment_time.slice(0, 5)
                                    }}</template>
                                </div>
                            </div>
                        </div>
                        <v-chip size="small" variant="tonal" :color="statusColors[item.status] ?? 'default'">
                            {{ item.status.replace('_', ' ') }}
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