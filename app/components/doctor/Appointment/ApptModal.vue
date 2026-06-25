<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Patient {
    id: string
    full_name: string
    medical_record_number: string
}

interface Appointment {
    id: string
    patient_id: string
    appointment_date: string
    appointment_time: string
    type: string
    status: string
    chief_complaint: string | null
    notes: string | null
}

const props = defineProps<{
    mode: 'add' | 'edit' | 'delete'
    appointment?: Appointment | null
    patients?: Patient[]
}>()

const emit = defineEmits<{
    (e: 'submit', data: any): void
    (e: 'cancel'): void
}>()

function getNowDate(): string {
    const now = new Date()
    return now.toISOString().split('T')[0] ?? ''
}

function getNowTime(): string {
    const now = new Date()
    return now.toTimeString().slice(0, 5)
}

const form = ref({
    patient_id: '',
    appointment_date: '',
    appointment_time: '',
    type: 'appointment',
    status: 'waiting',
    chief_complaint: '',
    notes: '',
})

watch(
    () => props.appointment,
    (appointment) => {
        if (appointment && props.mode === 'edit') {
            form.value = {
                patient_id: appointment.patient_id,
                appointment_date: appointment.appointment_date,
                appointment_time: appointment.appointment_time.slice(0, 5),
                type: appointment.type,
                status: appointment.status,
                chief_complaint: appointment.chief_complaint ?? '',
                notes: appointment.notes ?? '',
            }
        } else {
            form.value = {
                patient_id: '',
                appointment_date: getNowDate(),
                appointment_time: getNowTime(),
                type: 'appointment',
                status: 'waiting',
                chief_complaint: '',
                notes: '',
            }
        }
    },
    { immediate: true }
)

const config = computed(() => ({
    add: {
        title: 'Add Appointment',
        icon: 'mdi-calendar-plus',
        confirmColor: 'primary',
        confirmLabel: 'Create Appointment',
    },
    edit: {
        title: 'Edit Appointment',
        icon: 'mdi-calendar-edit',
        confirmColor: 'primary',
        confirmLabel: 'Save Changes',
    },
    delete: {
        title: 'Delete Appointment',
        icon: 'mdi-calendar-remove',
        confirmColor: 'error',
        confirmLabel: 'Delete Appointment',
    },
}[props.mode]))

function onSubmit() {
    if (props.mode === 'delete') {
        emit('submit', {
            id: props.appointment?.id,
        })
        return
    }

    emit('submit', {
        ...form.value,
        id: props.mode === 'edit'
            ? props.appointment?.id
            : undefined,
    })
}

const isFormValid = computed(() =>
    form.value.patient_id &&
    form.value.appointment_date &&
    form.value.appointment_time &&
    form.value.type &&
    form.value.status
)
</script>

<template>
    <v-card rounded="lg" max-width="600" width="100%">
        <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
            <div class="d-flex align-center ga-2">
                <v-icon :icon="config.icon" />
                <span class="text-h6 font-weight-bold">
                    {{ config.title }}
                </span>
            </div>

            <v-btn icon="mdi-close" variant="text" density="compact" @click="emit('cancel')" />
        </v-card-title>

        <v-divider />

        <template v-if="mode === 'delete'">
            <v-card-text class="pa-5 text-center">
                <v-avatar color="error" variant="tonal" size="56">
                    <v-icon icon="mdi-calendar-remove" size="28" />
                </v-avatar>

                <p class="mt-4 text-body-1 font-weight-medium">
                    Are you sure you want to delete this appointment?
                </p>

                <p class="text-body-2 text-medium-emphasis mt-2">
                    This action cannot be undone.
                </p>
            </v-card-text>
        </template>

        <template v-else>
            <v-card-text class="pa-4">
                <v-row dense>
                    <v-col cols="12">
                        <v-label class="mb-1">Patient</v-label>

                        <v-autocomplete v-model="form.patient_id" :items="patients" item-title="full_name"
                            item-value="id" variant="outlined" density="compact" hide-details clearable>
                            <template #item="{ props, item }">
                                <v-list-item v-bind="props">
                                    <v-list-item-title>
                                        {{ item.raw.full_name }}
                                    </v-list-item-title>
                                    <v-list-item-subtitle>
                                        {{ item.raw.medical_record_number }}
                                    </v-list-item-subtitle>
                                </v-list-item>
                            </template>
                        </v-autocomplete>
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-label class="mb-1">Appointment Date</v-label>

                        <v-text-field v-model="form.appointment_date" type="date" variant="outlined" density="compact"
                            hide-details />
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-label class="mb-1">Appointment Time</v-label>

                        <v-text-field v-model="form.appointment_time" type="time" variant="outlined" density="compact"
                            hide-details />
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-label class="mb-1">Type</v-label>

                        <v-select v-model="form.type" :items="['appointment', 'consultation', 'follow_up']"
                            variant="outlined" density="compact" hide-details />
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-label class="mb-1">Status</v-label>

                        <v-select v-model="form.status" :items="['waiting', 'in_progress', 'done', 'cancelled']"
                            variant="outlined" density="compact" hide-details />
                    </v-col>

                    <v-col cols="12">
                        <v-label class="mb-1">Chief Complaint</v-label>

                        <v-textarea v-model="form.chief_complaint" rows="3" variant="outlined" density="compact"
                            hide-details />
                    </v-col>

                    <v-col cols="12">
                        <v-label class="mb-1">Notes</v-label>

                        <v-textarea v-model="form.notes" rows="3" variant="outlined" density="compact" hide-details />
                    </v-col>

                </v-row>
            </v-card-text>
        </template>

        <v-divider />

        <v-card-actions class="pa-4">
            <v-spacer />

            <v-btn variant="tonal" color="secondary" @click="emit('cancel')">
                Cancel
            </v-btn>

            <v-btn variant="flat" :color="config.confirmColor" :disabled="mode !== 'delete' && !isFormValid"
                @click="onSubmit">
                {{ config.confirmLabel }}
            </v-btn>
        </v-card-actions>
    </v-card>
</template>