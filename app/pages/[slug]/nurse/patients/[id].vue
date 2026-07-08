<script setup lang="ts">
definePageMeta({
    layout: 'nurse',
    middleware: ['auth', 'permission', 'plan'],
    permissions: ['patient.view'],
    requiredFeature: 'nurse_module',
})

const route = useRoute()
const slug = route.params.slug as string
const id = route.params.id as string

const { data, pending } = await useFetch(`/api/nurse/patients/${id}`)

const patient = computed(() => data.value?.patient)
const profile = computed(() => patient.value?.profiles)
const summary = computed(() => data.value?.summary)
const appointments = computed(() => data.value?.appointments ?? [])
const medicalRecords = computed(() => data.value?.medical_records ?? [])
const vitals = computed(() => data.value?.vitals ?? [])
const prescriptions = computed(() => data.value?.prescriptions ?? [])
const billing = computed(() => data.value?.billing ?? [])
const referrals = computed(() => data.value?.referrals ?? [])

const activeTab = ref('info')

function getInitials(name?: string | null) {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

function formatDate(dateStr?: string | null) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric'
    })
}

function formatDateTime(dateStr?: string | null) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })
}

function formatCurrency(amount?: number | null) {
    if (amount == null) return '$0'

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

function formatTime(timeStr?: string | null) {
    if (!timeStr) return '-'
    return timeStr.slice(0, 5)
}

function calcAge(dob?: string | null) {
    if (!dob) return '-'
    const diff = Date.now() - new Date(dob).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)) + ' years'
}

function appointmentStatusColor(status: string) {
    const map: Record<string, string> = {
        waiting: 'warning', in_progress: 'info',
        done: 'success', cancelled: 'error'
    }
    return map[status] ?? 'default'
}

function prescriptionStatusColor(status: string) {
    const map: Record<string, string> = {
        Pending: 'warning', Verified: 'info',
        Dispensed: 'success', Rejected: 'error'
    }
    return map[status] ?? 'default'
}

function billingStatusColor(status: string) {
    const map: Record<string, string> = {
        paid: 'success', unpaid: 'error', partial: 'warning'
    }
    return map[status] ?? 'default'
}

function referralStatusColor(status: string) {
    const map: Record<string, string> = {
        pending: 'warning', accepted: 'info',
        completed: 'success', cancelled: 'error'
    }
    return map[status] ?? 'default'
}
</script>

<template>
    <div v-if="pending" class="text-center py-16">
        <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <div v-else-if="!patient" class="text-center py-16 text-medium-emphasis">
        <v-icon icon="mdi-account-off-outline" size="48" class="mb-3 d-block mx-auto" />
        Patient not found
    </div>

    <template v-else>
        <!-- Header -->
        <v-card variant="flat" class="mb-4">
            <v-card-item class="pa-5">
                <div class="d-flex align-center justify-space-between flex-wrap ga-4">
                    <div class="d-flex align-center ga-4">
                        <v-btn icon="mdi-arrow-left" variant="text" @click="navigateTo(`/${slug}/nurse/patients`)" />
                        <v-avatar size="56" color="primary" variant="tonal">
                            <v-img v-if="profile?.avatar_url" :src="profile.avatar_url" cover />
                            <span v-else class="text-h6 font-weight-bold">
                                {{ getInitials(patient.full_name) }}
                            </span>
                        </v-avatar>
                        <div>
                            <div class="text-h5 font-weight-bold">{{ patient.full_name }}</div>
                            <div class="d-flex align-center ga-2 mt-1 flex-wrap">
                                <v-chip size="small" color="primary" variant="tonal" label>
                                    {{ patient.medical_record_number ?? '-' }}
                                </v-chip>
                                <v-chip v-if="patient.gender" size="small" color="info" variant="tonal" label>
                                    {{ patient.gender }}
                                </v-chip>
                                <v-chip v-if="patient.blood_type" size="small" color="error" variant="tonal" label>
                                    {{ patient.blood_type }}
                                </v-chip>
                                <v-chip v-if="profile?.status" size="small"
                                    :color="profile.status === 'active' ? 'success' : 'warning'" variant="tonal" label>
                                    {{ profile.status }}
                                </v-chip>
                            </div>
                        </div>
                    </div>
                </div>
            </v-card-item>
        </v-card>

        <!-- Summary cards -->
        <v-row class="mb-4">
            <v-col cols="6" md="3" v-for="s in [
                { label: 'Appointments', value: summary?.total_appointments, icon: 'mdi-calendar', color: 'primary' },
                { label: 'Medical Records', value: summary?.total_medical_records, icon: 'mdi-medication', color: 'info' },
                { label: 'Total Billing', value: formatCurrency(summary?.total_billing), icon: 'mdi-cash', color: 'success' },
                { label: 'Unpaid', value: formatCurrency(summary?.unpaid_billing), icon: 'mdi-alert-circle', color: 'error' },
            ]" :key="s.label">
                <v-card variant="flat" height="100%">
                    <v-card-text class="d-flex align-center ga-3 pa-4">
                        <v-avatar :color="s.color" variant="tonal" size="44">
                            <v-icon :icon="s.icon" />
                        </v-avatar>
                        <div>
                            <div class="text-caption text-medium-emphasis">{{ s.label }}</div>
                            <div class="text-body-1 font-weight-bold">{{ s.value }}</div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Tabs -->
        <v-card variant="flat">
            <v-tabs v-model="activeTab" color="primary" density="comfortable">
                <v-tab value="info" prepend-icon="mdi-account">Info</v-tab>
                <v-tab value="appointments" prepend-icon="mdi-calendar">
                    Appointments
                    <v-chip class="ml-2" size="x-small" color="primary" variant="tonal">
                        {{ summary?.total_appointments }}
                    </v-chip>
                </v-tab>
                <v-tab value="records" prepend-icon="mdi-medication">
                    Medical Records
                    <v-chip class="ml-2" size="x-small" color="primary" variant="tonal">
                        {{ summary?.total_medical_records }}
                    </v-chip>
                </v-tab>
                <v-tab value="vitals" prepend-icon="mdi-heart-pulse">
                    Vitals
                    <v-chip class="ml-2" size="x-small" color="primary" variant="tonal">
                        {{ summary?.total_vitals }}
                    </v-chip>
                </v-tab>
                <v-tab value="prescriptions" prepend-icon="mdi-pill">
                    Prescriptions
                    <v-chip class="ml-2" size="x-small" color="primary" variant="tonal">
                        {{ summary?.total_prescriptions }}
                    </v-chip>
                </v-tab>
                <v-tab value="billing" prepend-icon="mdi-cash">
                    Billing
                    <v-chip class="ml-2" size="x-small" color="primary" variant="tonal">
                        {{ summary?.total_billing ? billing.length : 0 }}
                    </v-chip>
                </v-tab>
                <v-tab value="referrals" prepend-icon="mdi-share-variant">
                    Referrals
                    <v-chip class="ml-2" size="x-small" color="primary" variant="tonal">
                        {{ summary?.total_referrals }}
                    </v-chip>
                </v-tab>
            </v-tabs>

            <v-divider />

            <v-window v-model="activeTab">

                <!-- INFO -->
                <v-window-item value="info">
                    <v-card-text class="pa-6">
                        <v-row>

                            <!-- Personal Information -->
                            <v-col cols="12" md="6">
                                <v-card variant="outlined" rounded="lg" class="h-100 info-card">
                                    <v-card-item class="py-4">
                                        <template #prepend>
                                            <v-avatar color="primary" variant="tonal" size="42">
                                                <v-icon icon="mdi-account" />
                                            </v-avatar>
                                        </template>

                                        <div>
                                            <div class="text-h6 font-weight-bold">
                                                Personal Information
                                            </div>

                                            <div class="text-caption text-medium-emphasis">
                                                Patient identity and personal details
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
                                                    {{ patient.full_name }}
                                                </div>
                                            </v-col>

                                            <v-col cols="6">
                                                <div class="text-overline text-medium-emphasis">
                                                    Date of Birth
                                                </div>

                                                <div class="text-body-2">
                                                    {{ formatDate(patient.date_of_birth) }}
                                                </div>
                                            </v-col>

                                            <v-col cols="6">
                                                <div class="text-overline text-medium-emphasis">
                                                    Age
                                                </div>

                                                <div class="text-body-2">
                                                    {{ calcAge(patient.date_of_birth) }}
                                                </div>
                                            </v-col>

                                            <v-col cols="6">
                                                <div class="text-overline text-medium-emphasis mb-2">
                                                    Gender
                                                </div>

                                                <v-chip :color="patient.gender === 'male'
                                                    ? 'info'
                                                    : 'pink'" variant="tonal" size="small">
                                                    {{ patient.gender || "-" }}
                                                </v-chip>
                                            </v-col>

                                            <v-col cols="6">
                                                <div class="text-overline text-medium-emphasis mb-2">
                                                    Blood Type
                                                </div>

                                                <v-chip color="error" variant="tonal" size="small">
                                                    {{ patient.blood_type || "-" }}
                                                </v-chip>
                                            </v-col>

                                            <v-col cols="12">
                                                <div class="text-overline text-medium-emphasis">
                                                    Phone Number
                                                </div>

                                                <div class="text-body-2">
                                                    {{ patient.phone || "-" }}
                                                </div>
                                            </v-col>

                                            <v-col cols="12">
                                                <div class="text-overline text-medium-emphasis">
                                                    Address
                                                </div>

                                                <div class="text-body-2">
                                                    {{ patient.address || "-" }}
                                                </div>
                                            </v-col>

                                        </v-row>
                                    </v-card-text>
                                </v-card>
                            </v-col>

                            <!-- Account Information -->
                            <v-col cols="12" md="6">
                                <v-card variant="outlined" rounded="lg" class="h-100 info-card">
                                    <v-card-item class="py-4">
                                        <template #prepend>
                                            <v-avatar color="secondary" variant="tonal" size="42">
                                                <v-icon icon="mdi-shield-account" />
                                            </v-avatar>
                                        </template>

                                        <div>
                                            <div class="text-h6 font-weight-bold">
                                                Account Information
                                            </div>

                                            <div class="text-caption text-medium-emphasis">
                                                Medical record and account details
                                            </div>
                                        </div>
                                    </v-card-item>

                                    <v-divider />

                                    <v-card-text class="pa-6">
                                        <v-row>

                                            <v-col cols="12">
                                                <div class="text-overline text-medium-emphasis mb-2">
                                                    Medical Record Number
                                                </div>

                                                <v-chip color="primary" variant="tonal" label>
                                                    {{ patient.medical_record_number || "-" }}
                                                </v-chip>
                                            </v-col>

                                            <v-col cols="12">
                                                <div class="text-overline text-medium-emphasis">
                                                    Email Address
                                                </div>

                                                <div class="text-body-2">
                                                    {{ profile?.email || "-" }}
                                                </div>
                                            </v-col>

                                            <v-col cols="12">
                                                <div class="text-overline text-medium-emphasis mb-2">
                                                    Account Status
                                                </div>

                                                <v-chip :color="profile?.status === 'active'
                                                    ? 'success'
                                                    : 'warning'" variant="tonal" size="small">
                                                    {{ profile?.status || "-" }}
                                                </v-chip>
                                            </v-col>

                                            <v-col cols="12">
                                                <div class="text-overline text-medium-emphasis">
                                                    Registered
                                                </div>

                                                <div class="text-body-2">
                                                    {{ formatDate(patient.created_at) }}
                                                </div>
                                            </v-col>

                                        </v-row>
                                    </v-card-text>
                                </v-card>
                            </v-col>

                        </v-row>
                    </v-card-text>
                </v-window-item>

                <!-- APPOINTMENTS -->
                <v-window-item value="appointments">
                    <v-table hover density="comfortable">
                        <thead class="bg-containerBg">
                            <tr>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Date</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Time</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Doctor</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Department</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Type</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Status</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Complaint</th>
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
                                    {{ appt.doctors?.profiles?.full_name ?? '-' }}
                                    <div v-if="appt.doctors?.specialization" class="text-caption text-medium-emphasis">
                                        {{ appt.doctors.specialization }}
                                    </div>
                                </td>
                                <td class="py-3">
                                    <v-chip v-if="appt.departments" size="small" variant="tonal" color="secondary"
                                        label>
                                        {{ appt.departments.name }}
                                    </v-chip>
                                    <span v-else class="text-medium-emphasis">-</span>
                                </td>
                                <td class="py-3">
                                    <v-chip size="small" variant="tonal" color="secondary" label>
                                        {{ appt.type }}
                                    </v-chip>
                                </td>
                                <td class="py-3">
                                    <v-chip :color="appointmentStatusColor(appt.status)" size="small" variant="tonal">
                                        {{ appt.status }}
                                    </v-chip>
                                </td>
                                <td class="py-3 text-body-2 text-medium-emphasis">
                                    {{ appt.chief_complaint ?? '-' }}
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-window-item>

                <!-- MEDICAL RECORDS -->
                <v-window-item value="records">
                    <v-table hover density="comfortable">
                        <thead class="bg-containerBg">
                            <tr>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Date</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Doctor</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Diagnosis</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">ICD-10</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Vital Signs</th>
                                <th class="text-right text-caption font-weight-bold text-uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="!medicalRecords.length">
                                <td colspan="6" class="text-center py-8 text-medium-emphasis">
                                    <v-icon icon="mdi-medication" size="32" class="mb-2 d-block mx-auto" />
                                    No medical records found
                                </td>
                            </tr>
                            <tr v-for="rec in medicalRecords" :key="rec.id">
                                <td class="py-3 text-body-2">{{ formatDate(rec.created_at) }}</td>
                                <td class="py-3 text-body-2">
                                    {{ rec.doctors?.profiles?.full_name ?? '-' }}
                                </td>
                                <td class="py-3 text-body-2">{{ rec.diagnosis ?? '-' }}</td>
                                <td class="py-3">
                                    <v-chip v-if="rec.icd10_code" size="small" color="warning" variant="tonal" label>
                                        {{ rec.icd10_code }}
                                    </v-chip>
                                    <span v-else class="text-medium-emphasis">-</span>
                                </td>
                                <td class="py-3 text-caption text-medium-emphasis">
                                    <div v-if="rec.blood_pressure">BP: {{ rec.blood_pressure }}</div>
                                    <div v-if="rec.temperature">Temp: {{ rec.temperature }}°C</div>
                                    <div v-if="rec.heart_rate">HR: {{ rec.heart_rate }} bpm</div>
                                </td>
                                <td class="py-3 text-right">
                                    <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-eye-outline"
                                        @click="navigateTo(`/doctor/medical-records/${rec.id}`)">
                                        View
                                    </v-btn>
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-window-item>

                <!-- VITALS -->
                <v-window-item value="vitals">
                    <v-table hover density="comfortable">
                        <thead class="bg-containerBg">
                            <tr>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Recorded At</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Blood Pressure</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Temperature</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Pulse</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Weight</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Height</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Recorded By</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="!vitals.length">
                                <td colspan="8" class="text-center py-8 text-medium-emphasis">
                                    <v-icon icon="mdi-heart-pulse" size="32" class="mb-2 d-block mx-auto" />
                                    No vital signs recorded
                                </td>
                            </tr>
                            <tr v-for="vital in vitals" :key="vital.id">
                                <td class="py-3 text-body-2">{{ formatDateTime(vital.recorded_at) }}</td>
                                <td class="py-3">
                                    <v-chip size="small" color="error" variant="tonal" label>
                                        {{ vital.blood_pressure ?? '-' }}
                                    </v-chip>
                                </td>
                                <td class="py-3 text-body-2">
                                    {{ vital.temperature != null ? `${vital.temperature} °C` : '-' }}
                                </td>
                                <td class="py-3 text-body-2">
                                    {{ vital.pulse != null ? `${vital.pulse} bpm` : '-' }}
                                </td>
                                <td class="py-3 text-body-2">
                                    {{ vital.weight != null ? `${vital.weight} kg` : '-' }}
                                </td>
                                <td class="py-3 text-body-2">
                                    {{ vital.height != null ? `${vital.height} cm` : '-' }}
                                </td>
                                <td class="py-3 text-body-2 text-medium-emphasis">
                                    {{ vital.profiles?.full_name ?? '-' }}
                                </td>
                                <td class="py-3 text-body-2 text-medium-emphasis">
                                    {{ vital.notes ?? '-' }}
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-window-item>

                <!-- PRESCRIPTIONS -->
                <v-window-item value="prescriptions">
                    <v-table hover density="comfortable">
                        <thead class="bg-containerBg">
                            <tr>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Date</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Medicine</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Dosage</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Frequency</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Duration</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Instructions</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Doctor</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="!prescriptions.length">
                                <td colspan="8" class="text-center py-8 text-medium-emphasis">
                                    <v-icon icon="mdi-pill" size="32" class="mb-2 d-block mx-auto" />
                                    No prescriptions found
                                </td>
                            </tr>
                            <tr v-for="presc in prescriptions" :key="presc.id">
                                <td class="py-3 text-body-2">{{ formatDate(presc.created_at) }}</td>
                                <td class="py-3 text-body-2 font-weight-medium">{{ presc.medication_name }}</td>
                                <td class="py-3">
                                    <v-chip size="small" color="primary" variant="tonal" label>
                                        {{ presc.dosage ?? '-' }}
                                    </v-chip>
                                </td>
                                <td class="py-3">
                                    <v-chip size="small" color="success" variant="tonal" label>
                                        {{ presc.frequency ?? '-' }}
                                    </v-chip>
                                </td>
                                <td class="py-3 text-body-2">{{ presc.duration ?? '-' }}</td>
                                <td class="py-3 text-body-2 text-medium-emphasis">{{ presc.instructions ?? '-' }}</td>
                                <td class="py-3 text-body-2">{{ presc.doctors?.profiles?.full_name ?? '-' }}</td>
                                <td class="py-3">
                                    <v-chip :color="prescriptionStatusColor(presc.status)" size="small" variant="tonal">
                                        {{ presc.status }}
                                    </v-chip>
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-window-item>

                <!-- BILLING -->
                <v-window-item value="billing">
                    <v-table hover density="comfortable">
                        <thead class="bg-containerBg">
                            <tr>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Invoice</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Service</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Department</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Amount</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Payment Method</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Service Date</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Paid At</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="!billing.length">
                                <td colspan="8" class="text-center py-8 text-medium-emphasis">
                                    <v-icon icon="mdi-cash" size="32" class="mb-2 d-block mx-auto" />
                                    No billing records found
                                </td>
                            </tr>
                            <tr v-for="bill in billing" :key="bill.id">
                                <td class="py-3">
                                    <div class="text-body-2 font-weight-medium">{{ bill.invoice_number }}</div>
                                </td>
                                <td class="py-3 text-body-2">{{ bill.service_name }}</td>
                                <td class="py-3 text-body-2 text-medium-emphasis">{{ bill.department ?? '-' }}</td>
                                <td class="py-3 text-body-2 font-weight-medium">
                                    {{ formatCurrency(bill.amount) }}
                                </td>
                                <td class="py-3 text-body-2 text-medium-emphasis">
                                    {{ bill.payment_method ?? '-' }}
                                </td>
                                <td class="py-3 text-body-2">{{ formatDateTime(bill.service_date) }}</td>
                                <td class="py-3 text-body-2 text-medium-emphasis">
                                    {{ bill.paid_at ? formatDateTime(bill.paid_at) : '-' }}
                                </td>
                                <td class="py-3">
                                    <v-chip :color="billingStatusColor(bill.status)" size="small" variant="tonal">
                                        {{ bill.status }}
                                    </v-chip>
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-window-item>

                <!-- REFERRALS -->
                <v-window-item value="referrals">
                    <v-table hover density="comfortable">
                        <thead class="bg-containerBg">
                            <tr>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Date</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">From Doctor</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">To Department</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Reason</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Notes</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="!referrals.length">
                                <td colspan="6" class="text-center py-8 text-medium-emphasis">
                                    <v-icon icon="mdi-share-variant" size="32" class="mb-2 d-block mx-auto" />
                                    No referrals found
                                </td>
                            </tr>
                            <tr v-for="ref in referrals" :key="ref.id">
                                <td class="py-3 text-body-2">{{ formatDate(ref.created_at) }}</td>
                                <td class="py-3 text-body-2">
                                    {{ ref.doctors?.profiles?.full_name ?? '-' }}
                                </td>
                                <td class="py-3">
                                    <v-chip v-if="ref.departments" size="small" color="secondary" variant="tonal" label>
                                        {{ ref.departments.name }}
                                    </v-chip>
                                    <span v-else class="text-medium-emphasis">-</span>
                                </td>
                                <td class="py-3 text-body-2 text-medium-emphasis">{{ ref.reason ?? '-' }}</td>
                                <td class="py-3 text-body-2 text-medium-emphasis">{{ ref.notes ?? '-' }}</td>
                                <td class="py-3">
                                    <v-chip :color="referralStatusColor(ref.status)" size="small" variant="tonal">
                                        {{ ref.status }}
                                    </v-chip>
                                </td>
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