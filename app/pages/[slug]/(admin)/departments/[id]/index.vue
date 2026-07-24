<script setup lang="ts">
definePageMeta({
    layout: 'default',
    middleware: ['auth', 'permission'],
    permissions: ['department.view'],
})

const route = useRoute()
const slug = route.params.slug as string
const id = route.params.id as string
const refreshToken = Array.isArray(route.query.refresh) ? route.query.refresh[0] : route.query.refresh ?? ''

const { data, pending, refresh } = await useFetch(`/api/departments/${id}`, {
    key: `department-${id}-${refreshToken}`,
})
const department = computed(() => data.value)
const stats = computed(() => data.value?.stats)
const doctors = computed(() => data.value?.doctors ?? [])

const { data: apptData, pending: apptPending, refresh: refreshAppt } = await useFetch(`/api/departments/${id}/appointments`, {
    key: `department-${id}-appointments-${refreshToken}`,
    query: { limit: 50 },
})
const appointments = computed(() => apptData.value?.data ?? [])

onActivated(async () => {
    await Promise.all([refresh(), refreshAppt()])
})

const activeTab = ref('info')

function formatDate(dateStr?: string | null) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatTime(timeStr?: string | null) {
    if (!timeStr) return '-'
    return timeStr.slice(0, 5)
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
    }).format(amount)
}

function getInitials(name?: string | null) {
    if (!name) return '?'
    return name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
}

function appointmentStatusColor(status: string) {
    const map: Record<string, string> = {
        pending: 'warning', in_progress: 'info', completed: 'success', cancelled: 'error'
    }
    return map[status] ?? 'default'
}
</script>

<template>
    <div v-if="pending" class="text-center py-16">
        <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <div v-else-if="!department" class="text-center py-16 text-medium-emphasis">
        <v-icon icon="mdi-hospital-building" size="48" class="mb-3 d-block mx-auto" />
        Department not found
    </div>

    <template v-else>
        <!-- Header -->
        <v-card variant="flat" class="mb-4">
            <v-card-item class="pa-5">
                <div class="d-flex align-center justify-space-between flex-wrap ga-4">
                    <div class="d-flex align-center ga-4">
                        <v-btn icon="mdi-arrow-left" variant="text" @click="navigateTo(`/${slug}/departments`)" />
                        <v-avatar size="56" color="primary" variant="tonal">
                            <v-icon icon="mdi-hospital-building" size="28" />
                        </v-avatar>
                        <div>
                            <div class="text-h5 font-weight-bold">{{ department.name }}</div>
                            <div class="d-flex align-center ga-2 mt-1 flex-wrap">
                                <v-chip v-if="department.code" size="small" color="secondary" variant="tonal" label>
                                    {{ department.code }}
                                </v-chip>
                            </div>
                        </div>
                    </div>

                </div>
            </v-card-item>
        </v-card>

        <!-- Stats -->
        <v-row class="mb-4">
            <v-col cols="6" sm="4" md="2" v-for="s in [
                { label: 'Total Doctors', value: stats?.total_doctors, icon: 'mdi-doctor', color: 'primary' },
                { label: 'Available', value: stats?.available_doctors, icon: 'mdi-check-circle', color: 'success' },
                { label: 'Appointments', value: stats?.total_appointments, icon: 'mdi-calendar-check', color: 'info' },
                { label: 'Patients', value: stats?.total_patients, icon: 'mdi-account-group', color: 'secondary' },
                { label: 'Today', value: stats?.appointments_today, icon: 'mdi-calendar-today', color: 'warning' },
                { label: 'Completed', value: stats?.completed, icon: 'mdi-check-all', color: 'success' },
            ]" :key="s.label">
                <v-card variant="flat" height="100%">
                    <v-card-text class="d-flex align-center ga-3 pa-4">
                        <v-avatar :color="s.color" variant="tonal" size="40">
                            <v-icon :icon="s.icon" size="20" />
                        </v-avatar>
                        <div>
                            <div class="text-caption text-medium-emphasis">{{ s.label }}</div>
                            <div class="text-h6 font-weight-bold">{{ s.value ?? 0 }}</div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Tabs -->
        <v-card variant="flat">
            <v-tabs v-model="activeTab" color="primary" density="comfortable">
                <v-tab value="info" prepend-icon="mdi-information">Info</v-tab>
                <v-tab value="doctors" prepend-icon="mdi-doctor">
                    Doctors
                    <v-chip class="ml-2" size="x-small" color="primary" variant="tonal">
                        {{ stats?.total_doctors ?? 0 }}
                    </v-chip>
                </v-tab>
                <v-tab value="appointments" prepend-icon="mdi-calendar">
                    Appointments
                    <v-chip class="ml-2" size="x-small" color="primary" variant="tonal">
                        {{ stats?.total_appointments ?? 0 }}
                    </v-chip>
                </v-tab>
            </v-tabs>

            <v-divider />

            <v-window v-model="activeTab">

                <!-- INFO -->
                <v-window-item value="info">
                    <v-card-text class="pa-6">
                        <v-row>

                            <!-- Department -->
                            <v-col cols="12" md="6">
                                <v-card variant="outlined" :style="{ borderColor: '#e0e0e0' }" rounded="md"
                                    class="h-100">
                                    <v-card-item>
                                        <template #prepend>
                                            <v-avatar color="primary" variant="tonal" size="42">
                                                <v-icon icon="mdi-hospital-building" />
                                            </v-avatar>
                                        </template>

                                        <v-card-title class="font-weight-bold">
                                            Department Details
                                        </v-card-title>
                                    </v-card-item>

                                    <v-divider />

                                    <v-card-text>

                                        <v-row dense>

                                            <v-col cols="6">
                                                <div class="text-caption text-medium-emphasis">
                                                    Name
                                                </div>
                                                <div class="text-body-1 font-weight-medium">
                                                    {{ department.name }}
                                                </div>
                                            </v-col>

                                            <v-col cols="6">
                                                <div class="text-caption text-medium-emphasis">
                                                    Code
                                                </div>

                                                <v-chip size="small" color="primary" variant="tonal">
                                                    {{ department.code || "-" }}
                                                </v-chip>
                                            </v-col>

                                            <v-col cols="6">
                                                <div class="text-caption text-medium-emphasis">
                                                    Doctors
                                                </div>

                                                <div class="text-body-1 font-weight-medium">
                                                    {{ stats?.total_doctors ?? 0 }}
                                                </div>
                                            </v-col>

                                            <v-col cols="6">
                                                <div class="text-caption text-medium-emphasis">
                                                    Status
                                                </div>

                                                <v-chip color="success" size="small" variant="tonal">
                                                    Active
                                                </v-chip>
                                            </v-col>

                                            <v-col cols="6" class="mt-5">
                                                <div class="text-caption text-medium-emphasis">
                                                    Created
                                                </div>

                                                <div class="text-body-2">
                                                    {{ formatDate(department.created_at) }}
                                                </div>
                                            </v-col>

                                            <v-col cols="6" class="mt-5">
                                                <div class="text-caption text-medium-emphasis">
                                                    Last Updated
                                                </div>

                                                <div class="text-body-2">
                                                    {{ formatDate(department.updated_at) }}
                                                </div>
                                            </v-col>

                                        </v-row>

                                    </v-card-text>
                                </v-card>
                            </v-col>

                            <!-- Description -->
                            <v-col cols="12" md="6">
                                <v-card variant="outlined" :style="{ borderColor: '#e0e0e0' }" rounded="md"
                                    class="h-100">
                                    <v-card-item>
                                        <template #prepend>
                                            <v-avatar color="info" variant="tonal" size="42">
                                                <v-icon icon="mdi-text-box-outline" />
                                            </v-avatar>
                                        </template>

                                        <v-card-title class="font-weight-bold">
                                            Description
                                        </v-card-title>
                                    </v-card-item>

                                    <v-divider />

                                    <v-card-text>

                                        <div class="text-body-2" style="
                                min-height:140px;
                                line-height:1.7;
                            ">
                                            {{ department.description || "No description available." }}
                                        </div>

                                    </v-card-text>
                                </v-card>
                            </v-col>

                        </v-row>
                    </v-card-text>
                </v-window-item>

                <!-- DOCTORS -->
                <v-window-item value="doctors">
                    <v-table hover density="comfortable">
                        <thead class="bg-containerBg">
                            <tr>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Doctor</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Specialization</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Phone</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Experience</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Fee</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Status</th>
                                <th class="text-no-wrap text-right text-caption font-weight-bold text-uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="!doctors.length">
                                <td colspan="7" class="text-center py-8 text-medium-emphasis">
                                    <v-icon icon="mdi-doctor" size="32" class="mb-2 d-block mx-auto" />
                                    No doctors in this department
                                </td>
                            </tr>
                            <tr v-for="doc in doctors" :key="doc.id">
                                <td class="py-3">
                                    <div class="d-flex align-center ga-3">
                                        <v-avatar size="32" color="primary" variant="tonal">
                                            <v-img v-if="doc.profiles?.avatar_url" :src="doc.profiles.avatar_url"
                                                cover />
                                            <span v-else class="text-caption font-weight-bold">
                                                {{ getInitials(doc.profiles?.full_name) }}
                                            </span>
                                        </v-avatar>
                                        <div>
                                            <div class="text-body-2 font-weight-medium">{{ doc.profiles?.full_name ??
                                                '-' }}</div>
                                            <div class="text-caption text-medium-emphasis">{{ doc.profiles?.email ?? '-'
                                            }}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-3 text-body-2">{{ doc.specialization ?? '-' }}</td>
                                <td class="py-3 text-body-2 text-medium-emphasis">{{ doc.phone ?? '-' }}</td>
                                <td class="py-3 text-body-2">
                                    {{ doc.experience_years ? `${doc.experience_years} yrs` : '-' }}
                                </td>
                                <td class="py-3 text-body-2">{{ formatCurrency(doc.consultation_fee) }}</td>
                                <td class="py-3">
                                    <v-chip :color="doc.is_available ? 'success' : 'error'" size="small"
                                        variant="tonal">
                                        {{ doc.is_available ? 'Available' : 'Unavailable' }}
                                    </v-chip>
                                </td>
                                <td class="py-3 text-right">
                                    <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-eye-outline"
                                        @click="navigateTo(`/doctors/${doc.id}`)">
                                        View
                                    </v-btn>
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-window-item>

                <!-- APPOINTMENTS -->
                <v-window-item value="appointments">
                    <div v-if="apptPending" class="text-center py-8">
                        <v-progress-circular indeterminate color="primary" size="32" />
                    </div>
                    <v-table v-else hover density="comfortable">
                        <thead class="bg-containerBg">
                            <tr>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Date</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Time</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Patient</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Doctor</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Type</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Status</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Complaint</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="!appointments.length">
                                <td colspan="7" class="text-center py-8 text-medium-emphasis">
                                    <v-icon icon="mdi-calendar-blank" size="32" class="mb-2 d-block mx-auto" />
                                    No appointments found
                                </td>
                            </tr>
                            <tr v-for="appt in appointments" :key="appt.id">
                                <td class="py-3 text-body-2">{{ formatDate(appt.appointment_date) }}</td>
                                <td class="py-3 text-body-2">{{ formatTime(appt.appointment_time) }}</td>
                                <td class="py-3 text-body-2">
                                    <div class="font-weight-medium">{{ appt.patients?.full_name ?? '-' }}</div>
                                    <div v-if="appt.patients?.medical_record_number"
                                        class="text-caption text-medium-emphasis">
                                        {{ appt.patients.medical_record_number }}
                                    </div>
                                </td>
                                <td class="py-3 text-body-2">
                                    <div>{{ appt.doctors?.profiles?.full_name ?? '-' }}</div>
                                    <div v-if="appt.doctors?.specialization" class="text-caption text-medium-emphasis">
                                        {{ appt.doctors.specialization }}
                                    </div>
                                </td>
                                <td class="py-3">
                                    <v-chip size="small" variant="tonal" color="secondary" label>{{ appt.type
                                        }}</v-chip>
                                </td>
                                <td class="py-3">
                                    <v-chip :color="appointmentStatusColor(appt.status)" size="small" variant="tonal">
                                        {{ appt.status }}
                                    </v-chip>
                                </td>
                                <td class="py-3 text-body-2 text-medium-emphasis">{{ appt.chief_complaint ?? '-' }}</td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-window-item>

            </v-window>
        </v-card>
    </template>
</template>
