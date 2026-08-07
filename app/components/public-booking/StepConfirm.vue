<script setup lang="ts">
import { computed } from 'vue'
import type { PatientForm } from './StepDetails.vue'

const props = defineProps<{
    doctorName: string
    dateLabel: string
    time: string | null
    form: PatientForm
    submitting: boolean
}>()

const emit = defineEmits<{
    (e: 'confirm'): void
    (e: 'back'): void
}>()

function formatTime(t: string): string {
    const parts = (t ?? '').split(':')
    if (parts.length < 2) return t
    const h = Number(parts[0])
    const m = Number(parts[1])
    if (Number.isNaN(h) || Number.isNaN(m)) return t
    const period = h < 12 ? 'AM' : 'PM'
    const hour12 = h % 12 || 12
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

const genderLabel = computed(() => {
    if (props.form.gender === 'male') return 'Male'
    if (props.form.gender === 'female') return 'Female'
    return '-'
})
</script>

<template>
    <v-card elevation="0" variant="outlined" rounded="md" class="bg-surface" :style="{ borderColor: '#e0e0e0' }">
        <v-card-item class="pa-4 pb-2">
            <v-card-title class="text-h5 px-0">Confirm Your Booking</v-card-title>
            <v-card-subtitle class="mt-1 px-0">Review your details before confirming.</v-card-subtitle>
        </v-card-item>

        <v-card-text class="pa-4 pt-2">
            <v-list density="comfortable" class="bg-transparent pa-0">
                <v-list-subheader class="text-caption font-weight-bold text-uppercase">Appointment</v-list-subheader>
                <v-list-item prepend-icon="mdi-calendar-check" title="Date" :subtitle="dateLabel" />
                <v-list-item prepend-icon="mdi-doctor" title="Doctor" :subtitle="doctorName" />
                <v-list-item prepend-icon="mdi-clock-outline" title="Time"
                    :subtitle="time ? formatTime(time) : '-'" />

                <v-divider class="my-2" />

                <v-list-subheader class="text-caption font-weight-bold text-uppercase">Patient</v-list-subheader>
                <v-list-item prepend-icon="mdi-account" title="Full Name" :subtitle="form.full_name" />
                <v-list-item prepend-icon="mdi-email-outline" title="Email" :subtitle="form.email" />
                <v-list-item v-if="form.phone" prepend-icon="mdi-phone-outline" title="Phone" :subtitle="form.phone" />
                <v-list-item v-if="form.date_of_birth" prepend-icon="mdi-calendar-blank-outline" title="Date of Birth"
                    :subtitle="form.date_of_birth" />
                <v-list-item v-if="form.gender" prepend-icon="mdi-gender-male-female" title="Gender"
                    :subtitle="genderLabel" />
                <v-list-item v-if="form.chief_complaint" prepend-icon="mdi-text" title="Chief Complaint"
                    :subtitle="form.chief_complaint" />
            </v-list>

            <div class="d-flex justify-space-between mt-4">
                <v-btn variant="tonal" color="secondary" prepend-icon="mdi-arrow-left" size="large" :disabled="submitting"
                    @click="emit('back')">
                    Back
                </v-btn>
                <v-btn color="primary" variant="flat" prepend-icon="mdi-check" size="large" :loading="submitting"
                    :disabled="submitting" @click="emit('confirm')">
                    Confirm Booking
                </v-btn>
            </div>
        </v-card-text>
    </v-card>
</template>
