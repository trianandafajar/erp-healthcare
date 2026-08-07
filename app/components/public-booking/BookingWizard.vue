<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PatientForm } from './StepDetails.vue'
import WizardProgress from './WizardProgress.vue'
import StepDate from './StepDate.vue'
import StepDoctorTime from './StepDoctorTime.vue'
import StepDetails from './StepDetails.vue'
import StepConfirm from './StepConfirm.vue'

interface Holiday {
    id: string
    holiday_date: string
    name: string | null
}

interface Doctor {
    id: string
    full_name: string
    specialization: string | null
    department_id: string | null
    department_name: string | null
    photo_url: string | null
}

interface OpeningHour {
    day_of_week: number
    start_time: string
    end_time: string
    is_active: boolean
}

const props = defineProps<{
    token: string
    holidays: Holiday[]
    doctors: Doctor[]
    openingHours: OpeningHour[]
}>()

const emit = defineEmits<{
    (e: 'booked', summary: { date: string; time: string; doctor: string }): void
}>()

const steps = [
    { label: 'Date' },
    { label: 'Doctor & Time' },
    { label: 'Your Details' },
    { label: 'Confirm' },
]

const currentStep = ref(1)

const selectedDate = ref<Date | null>(null)
const selectedDoctor = ref<string | null>(null)
const selectedSlot = ref<string | null>(null)
const specializationFilter = ref('')
const availableDoctorIds = ref<Set<string>>(new Set())
const doctorSlots = ref<Record<string, string[]>>({})
const dateDoctorsLoading = ref(false)

const form = ref<PatientForm>({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    chief_complaint: '',
})

const submitting = ref(false)
const formError = ref('')

const selectedDateLabel = computed(() => {
    if (!selectedDate.value) return ''
    return selectedDate.value.toLocaleDateString('en-US', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
})

const specializations = computed(() => {
    const set = new Set<string>()
    for (const d of props.doctors) {
        if (d.specialization) set.add(d.specialization)
    }
    return [...set].sort()
})

const filteredDoctors = computed(() => {
    let doctors = props.doctors
    if (specializationFilter.value) {
        doctors = doctors.filter(d => d.specialization === specializationFilter.value)
    }
    if (selectedDate.value) {
        doctors = doctors.filter(d => availableDoctorIds.value.has(d.id))
    }
    return doctors
})

const selectedDoctorObj = computed(() =>
    props.doctors.find(d => d.id === selectedDoctor.value) ?? null
)

function toDateKey(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

async function fetchDoctorsForDate(d: Date): Promise<{ ids: Set<string>; slotsMap: Record<string, string[]> }> {
    const res = await $fetch<{ doctors: { id: string; slots: string[] }[] }>(
        `/api/public-booking/${props.token}/doctors`,
        { query: { date: toDateKey(d) } }
    )
    const ids = new Set<string>()
    const slotsMap: Record<string, string[]> = {}
    for (const doc of res.doctors ?? []) {
        ids.add(doc.id)
        slotsMap[doc.id] = doc.slots ?? []
    }
    return { ids, slotsMap }
}

async function loadDoctorsForDate(d: Date) {
    dateDoctorsLoading.value = true
    try {
        const { ids, slotsMap } = await fetchDoctorsForDate(d)
        availableDoctorIds.value = ids
        doctorSlots.value = slotsMap
    } catch {
        availableDoctorIds.value = new Set()
        doctorSlots.value = {}
    } finally {
        dateDoctorsLoading.value = false
    }
}

function goTo(step: number) {
    formError.value = ''
    currentStep.value = step
}

function onSelectDate(d: Date) {
    selectedDate.value = d
    selectedDoctor.value = null
    selectedSlot.value = null
    specializationFilter.value = ''
    formError.value = ''
    loadDoctorsForDate(d)
}

function onSelectSlot(doctorId: string, slot: string) {
    selectedDoctor.value = doctorId
    selectedSlot.value = slot
    formError.value = ''
}

function onDetailsNext(nextForm: PatientForm) {
    form.value = { ...nextForm }
    goTo(4)
}

async function submitBooking() {
    formError.value = ''
    if (!selectedDoctor.value || !selectedDate.value || !selectedSlot.value) return
    if (!form.value.full_name.trim() || !form.value.email.trim()) {
        formError.value = 'Name and email are required.'
        return
    }

    submitting.value = true
    try {
        // Re-fetch slots so an already-booked time is detected before submitting
        const { ids, slotsMap } = await fetchDoctorsForDate(selectedDate.value)
        availableDoctorIds.value = ids
        doctorSlots.value = slotsMap
        const freshSlots = slotsMap[selectedDoctor.value] ?? []
        if (!freshSlots.includes(selectedSlot.value)) {
            selectedSlot.value = null
            goTo(2)
            if (freshSlots.length) {
                formError.value = 'That time has just been booked. Please select another time.'
            } else {
                formError.value = 'This doctor has no remaining slots for this date.'
            }
            return
        }

        await $fetch(`/api/public-booking/${props.token}`, {
            method: 'POST',
            body: {
                doctor_id: selectedDoctor.value,
                appointment_date: toDateKey(selectedDate.value),
                appointment_time: selectedSlot.value,
                chief_complaint: form.value.chief_complaint.trim() || null,
                patient: {
                    full_name: form.value.full_name.trim(),
                    email: form.value.email.trim(),
                    phone: form.value.phone.trim() || null,
                    date_of_birth: form.value.date_of_birth || null,
                    gender: form.value.gender || null,
                },
            },
        })
        emit('booked', {
            date: toDateKey(selectedDate.value),
            time: selectedSlot.value,
            doctor: selectedDoctorObj.value?.full_name ?? 'Doctor',
        })
    } catch (e: any) {
        formError.value = e?.data?.message ?? 'Failed to create booking. Please try again.'
    } finally {
        submitting.value = false
    }
}
</script>

<template>
    <div class="d-flex flex-column ga-6">
        <v-card elevation="0" variant="outlined" rounded="md" class="bg-surface"
            :style="{ borderColor: '#e0e0e0' }">
            <v-card-text class="pa-4">
                <WizardProgress :steps="steps" :current="currentStep" />
            </v-card-text>
        </v-card>

        <v-alert v-if="formError" type="error" variant="tonal" density="comfortable" class="mb-0">
            {{ formError }}
        </v-alert>

        <StepDate v-if="currentStep === 1" :holidays="holidays" :opening-hours="openingHours"
            :selected-date="selectedDate" @select="onSelectDate"
            @next="goTo(2)" />

        <StepDoctorTime v-else-if="currentStep === 2" :doctors="filteredDoctors" :doctor-slots="doctorSlots"
            :selected-doctor="selectedDoctor" :selected-slot="selectedSlot" :loading="dateDoctorsLoading"
            :selected-date="selectedDate" :specializations="specializations"
            :specialization-filter="specializationFilter" @select-slot="onSelectSlot"
            @update:specialization-filter="specializationFilter = $event" @next="goTo(3)" @back="goTo(1)" />

        <StepDetails v-else-if="currentStep === 3" :initial-form="form"
            :doctor-name="selectedDoctorObj?.full_name ?? 'Doctor'" :date-label="selectedDateLabel" :time="selectedSlot"
            @next="onDetailsNext" @back="goTo(2)" />

        <StepConfirm v-else-if="currentStep === 4" :doctor-name="selectedDoctorObj?.full_name ?? 'Doctor'"
            :date-label="selectedDateLabel" :time="selectedSlot" :form="form" :submitting="submitting" @back="goTo(3)"
            @confirm="submitBooking" />
    </div>
</template>
