<script setup lang="ts">
definePageMeta({
    layout: 'default',
    middleware: ['authorize'],
    roles: ['admin'],
    permissions: ['nurse.view'],
})

const route = useRoute()
const slug = route.params.slug as string
const id = route.params.id as string

const { data, pending, refresh } = await useFetch(`/api/nurses/${id}`, {
    key: `nurse-${id}`,
})
const nurse = computed(() => data.value)
const stats = computed(() => data.value?.stats)
const schedules = computed(() => data.value?.active_schedules ?? [])
const profile = computed(() => data.value?.profiles)
const department = computed(() => data.value?.departments)

const { data: vitalData, pending: vitalPending, refresh: refreshVitals } = await useFetch(`/api/nurses/${id}/vital-signs`, {
    key: `nurse-${id}-vitals`,
    query: { limit: 20 },
})
const vitals = computed(() => vitalData.value?.data ?? [])

const { data: careData, pending: carePending, refresh: refreshCare } = await useFetch(`/api/nurses/${id}/care-notes`, {
    key: `nurse-${id}-care-notes`,
    query: { limit: 20 },
})
const careNotes = computed(() => careData.value?.data ?? [])

onActivated(async () => {
    await Promise.all([refresh(), refreshVitals(), refreshCare()])
})

const activeTab = ref('info')

function formatDate(dateStr?: string | null) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(dateStr?: string | null) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('en-US', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

function getInitials(name?: string | null) {
    if (!name) return '?'
    return name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function dayName(dayOfWeek: number) {
    return DAY_NAMES[dayOfWeek] ?? '-'
}

function formatTime(t?: string | null) {
    if (!t) return '-'
    return t.slice(0, 5)
}

const careNoteColor: Record<string, string> = {
    observation: 'info',
    medication: 'warning',
    procedure: 'secondary',
    education: 'success',
    assessment: 'primary',
}
</script>

<template>
    <div v-if="pending" class="text-center py-16">
        <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <div v-else-if="!nurse" class="text-center py-16 text-medium-emphasis">
        <v-icon icon="mdi-account-heart" size="48" class="mb-3 d-block mx-auto" />
        Nurse not found
    </div>

    <template v-else>
        <!-- Header -->
        <v-card variant="flat" class="mb-4">
            <v-card-item class="pa-5">
                <div class="d-flex align-center justify-space-between flex-wrap ga-4">
                    <div class="d-flex align-center ga-4">
                        <v-btn icon="mdi-arrow-left" variant="text" @click="navigateTo(`/${slug}/nurses`)" />
                        <v-avatar size="56" color="primary" variant="tonal">
                            <v-img v-if="profile?.avatar_url" :src="profile.avatar_url" cover />
                            <span v-else class="text-h6 font-weight-bold">
                                {{ getInitials(profile?.full_name) }}
                            </span>
                        </v-avatar>
                        <div>
                            <div class="text-h5 font-weight-bold">{{ profile?.full_name ?? '-' }}</div>
                            <div class="d-flex align-center ga-2 mt-1 flex-wrap">
                                <v-chip v-if="department" size="small" color="secondary" variant="tonal" label>
                                    {{ department.name }}
                                    <span v-if="department.code" class="ml-1 text-medium-emphasis">
                                        ({{ department.code }})
                                    </span>
                                </v-chip>
                                <v-chip :color="nurse.is_available ? 'success' : 'error'" size="small" variant="tonal">
                                    {{ nurse.is_available ? 'Available' : 'Unavailable' }}
                                </v-chip>
                            </div>
                        </div>
                    </div>

                </div>
            </v-card-item>
        </v-card>

        <!-- Stats -->
        <v-row class="mb-4">
            <v-col cols="6" sm="4" md="3" v-for="s in [
                { label: 'Total Patients', value: stats?.total_patients, icon: 'mdi-account-group', color: 'primary' },
                { label: 'Vital Signs', value: stats?.total_vital_signs, icon: 'mdi-heart-pulse', color: 'error' },
                { label: 'Care Notes', value: stats?.total_care_notes, icon: 'mdi-note-text', color: 'info' },
                { label: 'Procedures', value: stats?.total_procedures, icon: 'mdi-needle', color: 'secondary' },
                { label: 'Pending', value: stats?.procedures_pending, icon: 'mdi-clock-outline', color: 'warning' },
                { label: 'In Progress', value: stats?.procedures_in_progress, icon: 'mdi-progress-clock', color: 'orange' },
                { label: 'Completed', value: stats?.procedures_completed, icon: 'mdi-check-all', color: 'success' },
                { label: 'Vitals Today', value: stats?.vitals_today, icon: 'mdi-calendar-today', color: 'teal' },
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
                <v-tab value="schedules" prepend-icon="mdi-calendar-clock">
                    Schedules
                    <v-chip class="ml-2" size="x-small" color="primary" variant="tonal">
                        {{ schedules.length }}
                    </v-chip>
                </v-tab>
                <v-tab value="vitals" prepend-icon="mdi-heart-pulse">
                    Vital Signs
                    <v-chip class="ml-2" size="x-small" color="primary" variant="tonal">
                        {{ stats?.total_vital_signs ?? 0 }}
                    </v-chip>
                </v-tab>
                <v-tab value="care-notes" prepend-icon="mdi-note-text">
                    Care Notes
                    <v-chip class="ml-2" size="x-small" color="primary" variant="tonal">
                        {{ stats?.total_care_notes ?? 0 }}
                    </v-chip>
                </v-tab>
            </v-tabs>

            <v-divider />

            <v-window v-model="activeTab">

                <!-- INFO -->
                <v-window-item value="info">
                    <v-card-text class="pa-6">
                        <v-row>

                            <!-- Nurse Details -->
                            <v-col cols="12" md="6">
                                <v-card variant="outlined" rounded="lg" class="h-100 info-card">
                                    <v-card-item class="py-4">
                                        <template #prepend>
                                            <v-avatar color="primary" variant="tonal" size="42">
                                                <v-icon icon="mdi-account-heart" />
                                            </v-avatar>
                                        </template>

                                        <div>
                                            <div class="text-h6 font-weight-bold">
                                                Nurse Details
                                            </div>

                                            <div class="text-caption text-medium-emphasis">
                                                Professional profile and department information
                                            </div>
                                        </div>
                                    </v-card-item>

                                    <v-divider />

                                    <v-card-text class="pa-6">
                                        <v-row>

                                            <v-col cols="12">
                                                <div class="text-overline text-medium-emphasis">
                                                    Full Name
                                                </div>

                                                <div class="text-body-1 font-weight-bold">
                                                    {{ profile?.full_name || "-" }}
                                                </div>
                                            </v-col>

                                            <v-col cols="12">
                                                <div class="text-overline text-medium-emphasis">
                                                    Email Address
                                                </div>

                                                <div class="text-body-2">
                                                    {{ profile?.email || "-" }}
                                                </div>
                                            </v-col>

                                            <v-col cols="6">
                                                <div class="text-overline text-medium-emphasis">
                                                    Phone Number
                                                </div>

                                                <div class="text-body-2">
                                                    {{ nurse.phone || "-" }}
                                                </div>
                                            </v-col>

                                            <v-col cols="6">
                                                <div class="text-overline text-medium-emphasis">
                                                    Experience
                                                </div>

                                                <div class="text-body-2">
                                                    {{ nurse.experience_years || 0 }} Years
                                                </div>
                                            </v-col>

                                            <v-col cols="12">
                                                <div class="text-overline text-medium-emphasis">
                                                    Department
                                                </div>

                                                <div class="text-body-1 font-weight-medium">
                                                    {{ department?.name || "-" }}
                                                </div>
                                            </v-col>

                                            <v-col cols="6">
                                                <div class="text-overline text-medium-emphasis">
                                                    Created
                                                </div>

                                                <div class="text-body-2">
                                                    {{ formatDate(nurse.created_at) }}
                                                </div>
                                            </v-col>

                                            <v-col cols="6">
                                                <div class="text-overline text-medium-emphasis">
                                                    Last Updated
                                                </div>

                                                <div class="text-body-2">
                                                    {{ formatDate(nurse.updated_at) }}
                                                </div>
                                            </v-col>

                                        </v-row>
                                    </v-card-text>
                                </v-card>
                            </v-col>

                            <!-- Account -->
                            <v-col cols="12" md="6">
                                <v-card variant="outlined" rounded="lg" class="h-100 info-card">
                                    <v-card-item class="py-4">
                                        <template #prepend>
                                            <v-avatar color="secondary" variant="tonal" size="42">
                                                <v-icon icon="mdi-account-circle-outline" />
                                            </v-avatar>
                                        </template>

                                        <div>
                                            <div class="text-h6 font-weight-bold">
                                                Account Information
                                            </div>

                                            <div class="text-caption text-medium-emphasis">
                                                Account status and availability
                                            </div>
                                        </div>
                                    </v-card-item>

                                    <v-divider />

                                    <v-card-text class="pa-6">

                                        <div class="d-flex align-center ga-4 mb-6">

                                            <v-avatar size="72" color="primary" variant="tonal">
                                                <v-img v-if="profile?.avatar_url" :src="profile.avatar_url" cover />

                                                <span v-else class="text-h5 font-weight-bold">
                                                    {{ getInitials(profile?.full_name) }}
                                                </span>
                                            </v-avatar>

                                            <div>

                                                <div class="text-h6 font-weight-bold">
                                                    {{ profile?.full_name || "-" }}
                                                </div>

                                                <div class="text-body-2 text-medium-emphasis">
                                                    {{ profile?.email || "-" }}
                                                </div>

                                                <v-chip class="mt-3" :color="profile?.status === 'active'
                                                    ? 'success'
                                                    : 'warning'" variant="tonal" size="small">
                                                    {{ profile?.status || "-" }}
                                                </v-chip>

                                            </div>

                                        </div>

                                        <v-divider class="mb-6" />

                                        <div class="text-overline text-medium-emphasis mb-2">
                                            Availability
                                        </div>

                                        <v-chip :color="nurse.is_available ? 'success' : 'error'" variant="tonal"
                                            size="default" class="px-4">
                                            <v-icon start :icon="nurse.is_available
                                                ? 'mdi-check-circle'
                                                : 'mdi-close-circle'
                                                " />

                                            {{
                                                nurse.is_available
                                                    ? 'Currently Available'
                                                    : 'Currently Unavailable'
                                            }}
                                        </v-chip>

                                    </v-card-text>
                                </v-card>
                            </v-col>

                        </v-row>
                    </v-card-text>
                </v-window-item>

                <!-- SCHEDULES -->
                <v-window-item value="schedules">
                    <v-table hover density="comfortable">
                        <thead class="bg-containerBg">
                            <tr>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Day</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Start</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">End</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Max Patients</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="!schedules.length">
                                <td colspan="5" class="text-center py-8 text-medium-emphasis">
                                    <v-icon icon="mdi-calendar-blank" size="32" class="mb-2 d-block mx-auto" />
                                    No active schedules
                                </td>
                            </tr>
                            <tr v-for="sch in schedules" :key="sch.id">
                                <td class="py-3 text-body-2 font-weight-medium">{{ dayName(sch.day_of_week) }}</td>
                                <td class="py-3 text-body-2">{{ formatTime(sch.start_time) }}</td>
                                <td class="py-3 text-body-2">{{ formatTime(sch.end_time) }}</td>
                                <td class="py-3 text-body-2">{{ sch.max_patients ?? '-' }}</td>
                                <td class="py-3">
                                    <v-chip :color="sch.is_active ? 'success' : 'default'" size="small" variant="tonal">
                                        {{ sch.is_active ? 'Active' : 'Inactive' }}
                                    </v-chip>
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-window-item>

                <!-- VITAL SIGNS -->
                <v-window-item value="vitals">
                    <div v-if="vitalPending" class="text-center py-8">
                        <v-progress-circular indeterminate color="primary" size="32" />
                    </div>
                    <v-table v-else hover density="comfortable">
                        <thead class="bg-containerBg">
                            <tr>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Recorded At</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Patient</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Blood Pressure</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Temp (°C)</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Pulse</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Weight (kg)</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Height (cm)</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="!vitals.length">
                                <td colspan="8" class="text-center py-8 text-medium-emphasis">
                                    <v-icon icon="mdi-heart-pulse" size="32" class="mb-2 d-block mx-auto" />
                                    No vital signs recorded
                                </td>
                            </tr>
                            <tr v-for="v in vitals" :key="v.id">
                                <td class="py-3 text-body-2">{{ formatDateTime(v.recorded_at) }}</td>
                                <td class="py-3 text-body-2">
                                    <div class="font-weight-medium">{{ v.patients?.full_name ?? '-' }}</div>
                                    <div v-if="v.patients?.medical_record_number"
                                        class="text-caption text-medium-emphasis">
                                        {{ v.patients.medical_record_number }}
                                    </div>
                                </td>
                                <td class="py-3 text-body-2">{{ v.blood_pressure ?? '-' }}</td>
                                <td class="py-3 text-body-2">{{ v.temperature ?? '-' }}</td>
                                <td class="py-3 text-body-2">{{ v.pulse ?? '-' }}</td>
                                <td class="py-3 text-body-2">{{ v.weight ?? '-' }}</td>
                                <td class="py-3 text-body-2">{{ v.height ?? '-' }}</td>
                                <td class="py-3 text-body-2 text-medium-emphasis">{{ v.notes ?? '-' }}</td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-window-item>

                <!-- CARE NOTES -->
                <v-window-item value="care-notes">
                    <div v-if="carePending" class="text-center py-8">
                        <v-progress-circular indeterminate color="primary" size="32" />
                    </div>
                    <v-table v-else hover density="comfortable">
                        <thead class="bg-containerBg">
                            <tr>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Recorded At</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Patient</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Category</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Note</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Author</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="!careNotes.length">
                                <td colspan="5" class="text-center py-8 text-medium-emphasis">
                                    <v-icon icon="mdi-note-text" size="32" class="mb-2 d-block mx-auto" />
                                    No care notes recorded
                                </td>
                            </tr>
                            <tr v-for="cn in careNotes" :key="cn.id">
                                <td class="py-3 text-body-2">{{ formatDateTime(cn.recorded_at) }}</td>
                                <td class="py-3 text-body-2">
                                    <div class="font-weight-medium">{{ cn.patients?.full_name ?? '-' }}</div>
                                    <div v-if="cn.patients?.medical_record_number"
                                        class="text-caption text-medium-emphasis">
                                        {{ cn.patients.medical_record_number }}
                                    </div>
                                </td>
                                <td class="py-3">
                                    <v-chip :color="careNoteColor[cn.category] ?? 'default'" size="small"
                                        variant="tonal" label>
                                        {{ cn.category ?? '-' }}
                                    </v-chip>
                                </td>
                                <td class="py-3 text-body-2 text-medium-emphasis"
                                    style="max-width: 280px; white-space: normal;">
                                    {{ cn.note ?? '-' }}
                                </td>
                                <td class="py-3 text-body-2">{{ cn.author_name ?? '-' }}</td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-window-item>

            </v-window>
        </v-card>
    </template>
</template>

<style scoped>
.info-card {
    border-color: #e0e0e0 !important;
    transition: all .25s ease;
}

.text-overline {
    font-size: .72rem;
    letter-spacing: .08em;
}
</style>