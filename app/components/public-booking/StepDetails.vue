<script setup lang="ts">
import { reactive, computed } from 'vue'

export interface PatientForm {
    full_name: string
    email: string
    phone: string
    date_of_birth: string
    gender: string
    chief_complaint: string
}

const props = defineProps<{
    initialForm: PatientForm
    doctorName: string
    dateLabel: string
    time: string | null
}>()

const emit = defineEmits<{
    (e: 'next', form: PatientForm): void
    (e: 'back'): void
}>()

const form = reactive<PatientForm>({
    full_name: props.initialForm.full_name ?? '',
    email: props.initialForm.email ?? '',
    phone: props.initialForm.phone ?? '',
    date_of_birth: props.initialForm.date_of_birth ?? '',
    gender: props.initialForm.gender ?? '',
    chief_complaint: props.initialForm.chief_complaint ?? '',
})

const canContinue = computed(() => !!form.full_name.trim() && !!form.email.trim())

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

function onKeydownNumeric(e: KeyboardEvent) {
    if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Tab' && e.key !== 'ArrowLeft'
        && e.key !== 'ArrowRight' && e.key !== 'Delete' && e.key !== 'End' && e.key !== 'Home') {
        e.preventDefault()
    }
}
</script>

<template>
    <v-card elevation="0" variant="outlined" rounded="md" class="bg-surface" :style="{ borderColor: '#e0e0e0' }">
        <v-card-item class="pa-4 pb-2">
            <v-card-title class="text-h5 px-0">Your Details</v-card-title>
            <v-card-subtitle class="mt-1 px-0">
                {{ doctorName }} • {{ dateLabel }} at {{ time ? formatTime(time) : '-' }}
            </v-card-subtitle>
        </v-card-item>

        <v-card-text class="pa-4 pt-2">
            <v-form @submit.prevent="canContinue && emit('next', { ...form })">
                <div class="d-flex flex-column ga-4">
                    <v-text-field v-model="form.full_name" label="Full Name *" variant="outlined"
                        placeholder="Your full name" required />

                    <div class="d-flex flex-column flex-md-row ga-4">
                        <v-text-field v-model="form.email" label="Email *" type="email" variant="outlined"
                            placeholder="you@email.com" required class="flex-grow-1" />
                        <v-text-field v-model="form.phone" label="Phone" type="tel" variant="outlined"
                            placeholder="08xxxxxxxxxx" class="flex-grow-1" @keydown="onKeydownNumeric" />
                    </div>

                    <div class="d-flex flex-column flex-md-row ga-4">
                        <v-text-field v-model="form.date_of_birth" label="Date of Birth" type="date" variant="outlined"
                            class="flex-grow-1" />
                        <v-select v-model="form.gender"
                            :items="[{ title: 'Male', value: 'male' }, { title: 'Female', value: 'female' }]"
                            label="Gender" variant="outlined" clearable class="flex-grow-1" />
                    </div>

                    <v-textarea v-model="form.chief_complaint" label="Chief Complaint" variant="outlined" rows="2"
                        placeholder="Describe your symptoms (optional)" />

                    <div class="d-flex justify-space-between mt-2">
                        <v-btn color="secondary" variant="tonal" size="large" density="comfortable"
                            @click="emit('back')">
                            Back
                        </v-btn>
                        <v-btn color="primary" variant="flat" type="submit" size="large" :disabled="!canContinue">
                            Continue
                        </v-btn>
                    </div>
                </div>
            </v-form>
        </v-card-text>
    </v-card>
</template>
