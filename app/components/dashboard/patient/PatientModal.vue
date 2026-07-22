<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Patient {
    id: string
    medical_record_number?: string | null
    profile_id?: string | null
    full_name: string
    date_of_birth?: string | null
    gender?: string | null
    phone?: string | null
    address?: string | null
    blood_type?: string | null
    room?: string | null
    email?: string | null
    has_account?: boolean
}

const props = defineProps<{
    mode: 'add' | 'edit' | 'delete'
    patient?: Patient | null
    loading: boolean
}>()

const emit = defineEmits<{
    (e: 'submit', data: any): void
    (e: 'cancel'): void
}>()

const bloodTypes = ['A', 'B', 'AB', 'O']
const genders = [
    { title: 'Male', value: 'male' },
    { title: 'Female', value: 'female' },
]

const stayOptions = [
    { title: '1 Day', value: '1' },
    { title: '2 Days', value: '2' },
    { title: '3 Days', value: '3' },
    { title: '4 Days', value: '4' },
    { title: '5 Days', value: '5' },
    { title: '6 Days', value: '6' },
    { title: '7 Days', value: '7' },
    { title: '8 Days', value: '8' },
    { title: '9 Days', value: '9' },
    { title: '10 Days', value: '10' },
    { title: 'No Stay', value: 'No Stay' },
    { title: 'Undetermined', value: 'Undetermined' },
    { title: 'Ongoing', value: 'Ongoing' },
]

const form = ref({
    full_name: '',
    date_of_birth: '',
    gender: null as string | null,
    phone: '',
    address: '',
    blood_type: null as string | null,
    room: '',
    email: '',
    description: '',
    length_of_stay: null as string | null,
})

watch(
    () => props.patient,
    (patient) => {
        if (patient && props.mode === 'edit') {
            form.value = {
                full_name: patient.full_name ?? '',
                date_of_birth: patient.date_of_birth ?? '',
                gender: patient.gender ?? null,
                phone: patient.phone === '-' ? '' : (patient.phone ?? ''),
                address: patient.address === '-' ? '' : (patient.address ?? ''),
                blood_type: patient.blood_type ?? null,
                room: patient.room ?? '',
                email: patient.email ?? '',
                description: '',
                length_of_stay: null,
            }
        } else if (props.mode === 'add') {
            form.value = {
                full_name: '',
                date_of_birth: '',
                gender: null,
                phone: '',
                address: '',
                blood_type: null,
                room: '',
                email: '',
                description: '',
                length_of_stay: null,
            }
        }
    },
    { immediate: true }
)

const config = computed(() => ({
    add: {
        title: 'Add New Patient',
        icon: 'mdi-account-injury-outline',
        confirmColor: 'primary',
        confirmLabel: 'Create Patient',
    },
    edit: {
        title: 'Edit Patient',
        icon: 'mdi-pencil-outline',
        confirmColor: 'primary',
        confirmLabel: 'Save Changes',
    },
    delete: {
        title: 'Delete Patient',
        icon: 'mdi-delete-outline',
        confirmColor: 'error',
        confirmLabel: 'Delete Patient',
    },
}[props.mode]))

function onSubmit() {
    if (props.mode === 'delete') {
        emit('submit', {
            id: props.patient?.id,
        })
        return
    }

    emit('submit', {
        id: props.patient?.id,
        full_name: form.value.full_name,
        date_of_birth: form.value.date_of_birth || null,
        gender: form.value.gender,
        phone: form.value.phone,
        address: form.value.address,
        blood_type: form.value.blood_type,
        room: form.value.room || null,
        email: form.value.email || null,
        description: form.value.description || null,
        length_of_stay: form.value.length_of_stay || null,
    })
}
</script>

<template>
    <v-card rounded="lg" max-width="600" width="100%">
        <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
            <div class="d-flex align-center ga-2">
                <v-icon :icon="config.icon" size="20" />
                <span class="text-h6 font-weight-bold">
                    {{ config.title }}
                </span>
            </div>

            <v-btn icon="mdi-close" variant="text" density="compact" @click="emit('cancel')" />
        </v-card-title>

        <v-divider />

        <template v-if="mode === 'delete'">
            <v-card-text class="pa-5">
                <div class="d-flex flex-column align-center text-center ga-3">
                    <v-avatar color="error" variant="tonal" size="56">
                        <v-icon icon="mdi-delete-outline" size="28" />
                    </v-avatar>

                    <div>
                        <p class="text-body-1 font-weight-medium">
                            Are you sure you want to delete this patient?
                        </p>

                        <p class="text-body-2 text-medium-emphasis mt-1">
                            <strong>{{ patient?.full_name }}</strong>
                            <template v-if="patient?.medical_record_number">
                                ({{ patient.medical_record_number }})
                            </template>
                            will be permanently removed.
                        </p>
                    </div>
                </div>
            </v-card-text>
        </template>

        <template v-else>
            <v-card-text class="pa-4" style="max-height: 520px; overflow-y: auto;">
                <v-row dense>
                    <v-col v-if="mode === 'edit' && patient?.medical_record_number" cols="12">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Medical Record Number
                        </v-label>

                        <v-text-field :model-value="patient.medical_record_number" variant="outlined" density="compact"
                            hide-details disabled prepend-inner-icon="mdi-card-account-details-outline" />
                    </v-col>

                    <v-col cols="12" :class="mode === 'edit' ? 'mt-3' : ''">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Full Name
                        </v-label>

                        <v-text-field v-model="form.full_name" placeholder="e.g. Budi Santoso" variant="outlined"
                            density="compact" hide-details="auto" />
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Date of Birth
                        </v-label>

                        <v-text-field v-model="form.date_of_birth" type="date" variant="outlined" density="compact"
                            hide-details />
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Gender
                        </v-label>

                        <v-select v-model="form.gender" :items="genders" placeholder="Select gender" variant="outlined"
                            density="compact" hide-details clearable />
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Phone
                        </v-label>

                        <v-text-field v-model="form.phone" placeholder="e.g. 081234567890" variant="outlined"
                            density="compact" hide-details />
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Blood Type
                        </v-label>

                        <v-select v-model="form.blood_type" :items="bloodTypes" placeholder="Select blood type"
                            variant="outlined" density="compact" hide-details clearable />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Email
                        </v-label>

                        <v-text-field v-model="form.email" placeholder="e.g. patient@email.com" type="email"
                            variant="outlined" density="compact" hide-details :disabled="mode === 'edit'" />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Address
                        </v-label>

                        <v-textarea v-model="form.address" placeholder="Patient address" variant="outlined"
                            density="compact" rows="2" hide-details />
                    </v-col>

                    <template v-if="mode === 'add'">
                        <v-col cols="12" sm="6" class="mt-3">
                            <v-label class="text-caption font-weight-medium mb-1">
                                Length of Stay
                            </v-label>

                            <v-select v-model="form.length_of_stay" :items="stayOptions"
                                placeholder="Select length of stay" variant="outlined" density="compact" hide-details
                                clearable />
                        </v-col>

                        <v-col cols="12" sm="6" class="mt-3">
                            <v-label class="text-caption font-weight-medium mb-1">
                                Room
                            </v-label>

                            <v-text-field v-model="form.room" placeholder="e.g. 12A" variant="outlined"
                                density="compact" hide-details />
                        </v-col>

                        <v-col cols="12" class="mt-3">
                            <v-label class="text-caption font-weight-medium mb-1">
                                Description
                            </v-label>

                            <v-textarea v-model="form.description"
                                placeholder="Describe the patient's condition / disease" variant="outlined"
                                density="compact" rows="3" hide-details />
                        </v-col>
                    </template>

                    <v-col v-if="mode === 'edit'" cols="12" class="mt-3">
                        <v-alert v-if="patient?.has_account" type="success" variant="tonal" density="compact"
                            icon="mdi-account-check-outline">
                            This patient has a linked account ({{ patient?.email }})
                        </v-alert>
                        <v-alert v-else type="info" variant="tonal" density="compact" icon="mdi-account-off-outline">
                            Walk-in patient, no linked account
                        </v-alert>
                    </v-col>
                </v-row>
            </v-card-text>
        </template>

        <v-divider />

        <v-card-actions class="pa-4 pt-3">
            <v-spacer />

            <v-btn variant="tonal" color="secondary" :disabled="props.loading" @click="emit('cancel')">
                Cancel
            </v-btn>
            <v-btn variant="flat" :color="config.confirmColor" :loading="props.loading" :disabled="props.loading"
                :style="props.loading ? 'cursor: not-allowed; pointer-events: auto;' : ''" @click="onSubmit">
                {{ config.confirmLabel }}
            </v-btn>
        </v-card-actions>
    </v-card>
</template>