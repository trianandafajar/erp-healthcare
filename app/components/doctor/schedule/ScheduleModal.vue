<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface DoctorSchedule {
    id: string
    day_of_week: number
    start_time: string
    end_time: string
    max_patients: number
    is_active: boolean
    public_booking_enabled: boolean
    public_booking_duration_minutes?: number | null
}

const DAY_OPTIONS = [
    { title: 'Sunday', value: 0 },
    { title: 'Monday', value: 1 },
    { title: 'Tuesday', value: 2 },
    { title: 'Wednesday', value: 3 },
    { title: 'Thursday', value: 4 },
    { title: 'Friday', value: 5 },
    { title: 'Saturday', value: 6 },
]

const props = defineProps<{
    mode: 'add' | 'edit' | 'delete'
    schedule?: DoctorSchedule | null
    schedules?: DoctorSchedule[]
    loading: boolean
}>()

const availableDays = computed(() => {
    const usedDays = props.schedules?.map(s => s.day_of_week) ?? []

    return DAY_OPTIONS.filter(day => {
        if (
            props.mode === 'edit' &&
            day.value === props.schedule?.day_of_week
        ) {
            return true
        }

        return !usedDays.includes(day.value)
    })
})

const emit = defineEmits<{
    (e: 'submit', data: any): void
    (e: 'cancel'): void
}>()

const form = ref({
    day_of_week: availableDays.value[0]?.value ?? 0,
    start_time: '',
    end_time: '',
    max_patients: 20,
    is_active: true,
    public_booking_enabled: false,
    public_booking_duration_minutes: null as number | null,
})

watch(
    [() => props.schedule, availableDays],
    ([schedule]) => {
        if (schedule && props.mode === 'edit') {
            form.value = {
                day_of_week: schedule.day_of_week,
                start_time: schedule.start_time.slice(0, 5),
                end_time: schedule.end_time.slice(0, 5),
                max_patients: schedule.max_patients,
                is_active: schedule.is_active,
                public_booking_enabled: schedule.public_booking_enabled ?? false,
                public_booking_duration_minutes: schedule.public_booking_duration_minutes ?? null,
            }
        } else if (props.mode === 'add') {
            form.value = {
                day_of_week: availableDays.value[0]?.value ?? 0,
                start_time: '',
                end_time: '',
                max_patients: 20,
                is_active: true,
                public_booking_enabled: false,
                public_booking_duration_minutes: null,
            }
        }
    },
    { immediate: true }
)

const config = computed(() => ({
    add: {
        title: 'Add Schedule',
        icon: 'mdi-calendar-plus',
        confirmColor: 'primary',
        confirmLabel: 'Create Schedule',
    },
    edit: {
        title: 'Edit Schedule',
        icon: 'mdi-calendar-edit',
        confirmColor: 'primary',
        confirmLabel: 'Save Changes',
    },
    delete: {
        title: 'Delete Schedule',
        icon: 'mdi-calendar-remove',
        confirmColor: 'error',
        confirmLabel: 'Delete Schedule',
    },
}[props.mode]))

const dayName = computed(() =>
    DAY_OPTIONS.find(d => d.value === props.schedule?.day_of_week)?.title ?? '-'
)

function onSubmit() {
    if (props.mode === 'delete') {
        emit('submit', { id: props.schedule?.id })
        return
    }
    emit('submit', {
        ...form.value,
        public_booking_duration_minutes: form.value.public_booking_enabled
            ? Number(form.value.public_booking_duration_minutes)
            : null,
        id: props.mode === 'edit' ? props.schedule?.id : undefined,
    })
}

const startEndError = computed(() =>
    form.value.start_time && form.value.end_time && form.value.end_time <= form.value.start_time
        ? 'End time must be after start time.'
        : ''
)

const durationError = computed(() => {
    if (!form.value.public_booking_enabled) return ''
    const duration = Number(form.value.public_booking_duration_minutes)
    if (!form.value.public_booking_duration_minutes || !Number.isInteger(duration) || duration < 5) {
        return 'Required, minimum 5 minutes.'
    }
    return ''
})

const isFormValid = computed(() =>
    form.value.start_time !== '' && form.value.end_time !== ''
    && startEndError.value === '' && durationError.value === ''
)
</script>

<template>
    <v-card rounded="lg" max-width="480" width="100%">
        <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
            <div class="d-flex align-center ga-2">
                <v-icon :icon="config.icon" size="20" />
                <span class="text-h6 font-weight-bold">{{ config.title }}</span>
            </div>
            <v-btn icon="mdi-close" variant="text" density="compact" @click="emit('cancel')" :disabled="loading" />
        </v-card-title>

        <v-divider />

        <template v-if="mode === 'delete'">
            <v-card-text class="pa-5">
                <div class="d-flex flex-column align-center text-center ga-3">
                    <v-avatar color="error" variant="tonal" size="56">
                        <v-icon icon="mdi-calendar-remove" size="28" />
                    </v-avatar>
                    <div>
                        <p class="text-body-1 font-weight-medium">
                            Are you sure you want to delete this schedule?
                        </p>
                        <p class="text-body-2 text-medium-emphasis mt-1">
                            <strong>{{ dayName }}</strong>,
                            {{ schedule?.start_time?.slice(0, 5) }} – {{ schedule?.end_time?.slice(0, 5) }}
                            will be permanently removed.
                        </p>
                    </div>
                </div>
            </v-card-text>
        </template>

        <template v-else>
            <v-card-text class="pa-4">
                <v-row dense>

                    <v-col cols="12">
                        <v-label class="text-caption font-weight-medium mb-1">Day</v-label>
                        <v-select v-model="form.day_of_week" :items="availableDays" item-value="value"
                            variant="outlined" density="compact" hide-details />
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Start Time</v-label>
                        <v-text-field v-model="form.start_time" type="time" variant="outlined" density="compact"
                            hide-details :error="!!startEndError" :error-messages="startEndError" />
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">End Time</v-label>
                        <v-text-field v-model="form.end_time" type="time" variant="outlined" density="compact"
                            hide-details :error="!!startEndError" :error-messages="startEndError" />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Max Patients</v-label>
                        <v-text-field v-model.number="form.max_patients" type="number" min="1" variant="outlined"
                            density="compact" hide-details :rules="[v => v >= 1 || 'Must be at least 1']"
                            @keydown="e => { if (e.key === '-' || e.key === '.') e.preventDefault() }" />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-switch v-model="form.is_active" color="success" label="Active" hide-details
                            density="compact" />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-switch v-model="form.public_booking_enabled" color="primary"
                            label="Public Booking (online)" hide-details density="compact" />
                    </v-col>

                    <template v-if="form.public_booking_enabled">
                        <v-col cols="12" class="mt-3">
                            <v-divider class="mb-2" />
                            <div class="d-flex align-center ga-2">
                                <v-icon icon="mdi-clock-outline" size="18" color="primary" />
                                <v-label class="text-caption font-weight-bold text-uppercase">
                                    Public Booking
                                </v-label>
                            </div>
                            <div class="text-caption text-medium-emphasis mt-1">
                                Time slots are divided automatically from the clinic opening hours.
                            </div>
                        </v-col>

                        <v-col cols="12" class="mt-1">
                            <v-label class="text-caption font-weight-medium mb-1">Duration per Examination (minutes)</v-label>
                            <v-text-field v-model.number="form.public_booking_duration_minutes" type="number" min="5"
                                variant="outlined" density="compact" hide-details :error="!!durationError"
                                :error-messages="durationError" suffix="min" placeholder="e.g. 30"
                                @keydown="e => { if (e.key === '-' || e.key === '.') e.preventDefault() }" />
                        </v-col>
                    </template>
                </v-row>
            </v-card-text>
        </template>

        <v-divider />

        <v-card-actions class="pa-4 pt-3">
            <v-spacer />
            <v-btn variant="tonal" color="secondary" :disabled="loading" @click="emit('cancel')">
                Cancel
            </v-btn>
            <v-btn variant="flat" :color="config.confirmColor" :loading="loading"
                :disabled="loading || (mode !== 'delete' && !isFormValid)"
                :style="(loading || (mode !== 'delete' && !isFormValid)) ? 'cursor: not-allowed; pointer-events: auto;' : ''"
                @click="onSubmit">
                {{ config.confirmLabel }}
            </v-btn>
        </v-card-actions>
    </v-card>
</template>