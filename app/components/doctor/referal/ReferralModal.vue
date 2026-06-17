<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Department {
    id: string
    name: string
    code?: string
}

interface Doctor {
    id: string
    full_name: string
    department_id?: string | null
}

const props = defineProps<{
    modelValue: boolean
    departments: Department[]
    doctors: Doctor[]
    saving?: boolean
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'submit', data: { to_department_id: string; to_doctor_id: string | null; reason: string; notes: string }): void
}>()

const form = ref({
    to_department_id: null as string | null,
    to_doctor_id: null as string | null,
    reason: '',
    notes: '',
})

watch(
    () => props.modelValue,
    (open) => {
        if (open) {
            form.value = { to_department_id: null, to_doctor_id: null, reason: '', notes: '' }
        }
    }
)

const filteredDoctors = computed(() => {
    if (!form.value.to_department_id) return []
    return props.doctors.filter(d => d.department_id === form.value.to_department_id)
})

watch(() => form.value.to_department_id, () => {
    form.value.to_doctor_id = null
})

const isValid = computed(() => {
    return !!form.value.to_department_id && !!form.value.reason.trim()
})

function close() {
    emit('update:modelValue', false)
}

function onSubmit() {
    if (!isValid.value) return
    emit('submit', {
        to_department_id: form.value.to_department_id!,
        to_doctor_id: form.value.to_doctor_id,
        reason: form.value.reason,
        notes: form.value.notes,
    })
}
</script>

<template>
    <v-dialog :model-value="modelValue" max-width="520" persistent
        @update:model-value="emit('update:modelValue', $event)">
        <v-card rounded="lg">
            <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
                <div class="d-flex align-center ga-2">
                    <v-icon icon="mdi-share-variant-outline" size="20" />
                    <span class="text-h6 font-weight-bold">Refer Patient</span>
                </div>
                <v-btn icon="mdi-close" variant="text" density="compact" @click="close" />
            </v-card-title>

            <v-divider />

            <v-card-text class="pa-4">
                <v-row dense>
                    <v-col cols="12">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Destination Department
                        </v-label>
                        <v-select v-model="form.to_department_id" :items="departments" item-title="name" item-value="id"
                            placeholder="Select department" variant="outlined" density="compact" hide-details="auto" />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Destination Doctor (optional)
                        </v-label>
                        <v-select v-model="form.to_doctor_id" :items="filteredDoctors" item-title="full_name"
                            item-value="id" placeholder="Select doctor, or leave blank for department queue"
                            variant="outlined" density="compact" hide-details clearable
                            :disabled="!form.to_department_id"
                            :no-data-text="form.to_department_id ? 'No doctors in this department' : 'Select a department first'" />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Reason for Referral
                        </v-label>
                        <v-textarea v-model="form.reason" placeholder="Why is this patient being referred?"
                            variant="outlined" density="compact" rows="3" hide-details />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Additional Notes (optional)
                        </v-label>
                        <v-textarea v-model="form.notes" placeholder="Any additional context..." variant="outlined"
                            density="compact" rows="2" hide-details />
                    </v-col>
                </v-row>
            </v-card-text>

            <v-divider />

            <v-card-actions class="pa-4 pt-3">
                <v-spacer />
                <v-btn variant="tonal" color="secondary" @click="close">Cancel</v-btn>
                <v-btn variant="flat" color="primary" :loading="saving" :disabled="!isValid" @click="onSubmit">
                    Save & Refer
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>