<script setup lang="ts">
const props = defineProps<{
    mode: 'add' | 'edit' | 'delete'
    user?: {
        id: string
        name: string
        email: string
        role: string
        status: string
        is_owner?: boolean
    } | null
    loading?: boolean
}>()

const emit = defineEmits<{
    (e: 'submit', data: any): void
    (e: 'cancel'): void
}>()

const { data: rolesData } = useLazyFetch<{ roles: any[] }>('/api/roles')
const { data: deptData } = useLazyFetch<{ departments: any[] }>('/api/departments')

const roles = computed(() =>
    (rolesData.value?.roles ?? []).map((r) => ({
        id: r.id,
        name: r.name ?? '-',
        label: r.label ?? '-',
    }))
)

const departments = computed(() => deptData.value?.departments ?? [])

const bloodTypes = ['A', 'B', 'AB', 'O']
const genderOptions = [
    { title: 'Male', value: 'male' },
    { title: 'Female', value: 'female' },
]

const form = ref({
    full_name: '',
    email: '',
    role: 'patient',
    status: 'active',
    // doctor fields
    department_id: null as string | null,
    specialization: '',
    str_number: '',
    sip_number: '',
    phone: '',
    biography: '',
    experience_years: 0,
    consultation_fee: 0,
    is_available: true,
    // patient fields
    date_of_birth: '',
    gender: null as string | null,
    blood_type: null as string | null,
    address: '',
    room: '',
})

watch(() => props.user, (u) => {
    if (u && props.mode === 'edit') {
        form.value = {
            ...form.value,
            full_name: u.name,
            email: u.email,
            role: u.role,
            status: u.status,
        }
    } else {
        form.value = {
            full_name: '',
            email: '',
            role: 'patient',
            status: 'active',
            department_id: null,
            specialization: '',
            str_number: '',
            sip_number: '',
            phone: '',
            biography: '',
            experience_years: 0,
            consultation_fee: 0,
            is_available: true,
            date_of_birth: '',
            gender: null,
            blood_type: null,
            address: '',
            room: '',
        }
    }
}, { immediate: true })

const config = computed(() => {
    const map = {
        add: { title: 'Add New User', icon: 'mdi-account-plus', confirmColor: 'primary', confirmLabel: 'Add User' },
        edit: { title: 'Edit User', icon: 'mdi-account-edit', confirmColor: 'primary', confirmLabel: 'Save Changes' },
        delete: { title: 'Delete User', icon: 'mdi-account-remove', confirmColor: 'error', confirmLabel: 'Delete' }
    }
    return map[props.mode]
})

function onSubmit() {
    if (props.mode === 'delete') {
        emit('submit', { id: props.user?.id })
    } else {
        const payload: Record<string, any> = {
            ...form.value,
            id: props.user?.id,
            password: 'Password123',
        }
        if (form.value.role !== 'doctor') {
            delete payload.department_id
            delete payload.specialization
            delete payload.str_number
            delete payload.sip_number
            delete payload.biography
            delete payload.consultation_fee
        }
        if (form.value.role !== 'doctor' && form.value.role !== 'nurse') {
            delete payload.experience_years
            delete payload.is_available
        }
        if (form.value.role !== 'patient') {
            delete payload.date_of_birth
            delete payload.gender
            delete payload.blood_type
            delete payload.address
            delete payload.room
        }
        if (form.value.role !== 'doctor' && form.value.role !== 'nurse') {
            delete payload.phone
        }
        emit('submit', payload)
    }
}
</script>

<template>
    <v-card rounded="lg" min-width="520">
        <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
            <div class="d-flex align-center ga-2">
                <v-icon :icon="config.icon" size="20" />
                <span class="text-h6 font-weight-bold">{{ config.title }}</span>
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
                        <p class="text-body-1 font-weight-medium">Are you sure you want to delete this user?</p>
                        <p class="text-body-2 text-medium-emphasis mt-1">
                            <strong>{{ user?.name }}</strong> ({{ user?.email }}) will be permanently removed.
                        </p>
                    </div>
                </div>
            </v-card-text>
        </template>

        <template v-else>
            <v-card-text class="pa-4" style="max-height: 560px; overflow-y: auto;">
                <v-row dense>
                    <v-col cols="12">
                        <v-label class="text-caption font-weight-medium mb-1">Full Name</v-label>
                        <v-text-field v-model="form.full_name" placeholder="e.g. John Doe" variant="outlined"
                            density="compact" hide-details="auto" />
                    </v-col>
                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Email</v-label>
                        <v-text-field v-model="form.email" placeholder="e.g. john@example.com" variant="outlined"
                            density="compact" hide-details="auto" type="email" :disabled="mode === 'edit'" />
                    </v-col>
                    <v-col cols="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Role</v-label>
                        <v-select v-model="form.role" :items="roles" item-title="label" item-value="name"
                            variant="outlined" density="compact" hide-details
                            :disabled="mode === 'edit' && user?.is_owner" />
                    </v-col>
                    <v-col cols="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Status</v-label>
                        <v-select v-model="form.status"
                            :items="[{ title: 'Active', value: 'active' }, { title: 'Inactive', value: 'inactive' }]"
                            variant="outlined" density="compact" hide-details />
                    </v-col>

                    <!-- Doctor-specific fields -->
                    <template v-if="form.role === 'doctor'">
                        <v-col cols="12" class="mt-4">
                            <v-divider />
                            <div class="text-subtitle-2 font-weight-bold mt-3 mb-2">Doctor Details</div>
                        </v-col>
                        <v-col cols="12" sm="6" class="mt-1">
                            <v-label class="text-caption font-weight-medium mb-1">Department / Poli</v-label>
                            <v-select v-model="form.department_id" :items="departments" item-title="name"
                                item-value="id" placeholder="Select department" variant="outlined" density="compact"
                                hide-details clearable />
                        </v-col>
                        <v-col cols="12" sm="6" class="mt-1">
                            <v-label class="text-caption font-weight-medium mb-1">Specialization</v-label>
                            <v-text-field v-model="form.specialization" placeholder="e.g. Pediatrician"
                                variant="outlined" density="compact" hide-details />
                        </v-col>
                        <v-col cols="12" sm="6" class="mt-3">
                            <v-label class="text-caption font-weight-medium mb-1">STR Number</v-label>
                            <v-text-field v-model="form.str_number" placeholder="Enter STR Number" variant="outlined"
                                density="compact" hide-details inputmode="numeric"
                                @keydown="e => { if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Delete' && e.key !== 'End' && e.key !== 'Home') e.preventDefault() }" />
                        </v-col>
                        <v-col cols="12" sm="6" class="mt-3">
                            <v-label class="text-caption font-weight-medium mb-1">SIP Number</v-label>
                            <v-text-field v-model="form.sip_number" placeholder="Enter SIP Number" variant="outlined"
                                density="compact" hide-details inputmode="numeric"
                                @keydown="e => { if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Delete' && e.key !== 'End' && e.key !== 'Home') e.preventDefault() }" />
                        </v-col>
                        <v-col cols="12" sm="6" class="mt-3">
                            <v-label class="text-caption font-weight-medium mb-1">Phone</v-label>
                            <v-text-field v-model="form.phone" placeholder="e.g. 081234567890" variant="outlined"
                                density="compact" hide-details type="tel" inputmode="numeric"
                                @keydown="e => { if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Delete' && e.key !== 'End' && e.key !== 'Home') e.preventDefault() }" />
                        </v-col>
                        <v-col cols="6" sm="3" class="mt-3">
                            <v-label class="text-caption font-weight-medium mb-1">Experience (years)</v-label>
                            <v-text-field v-model.number="form.experience_years" type="number" min="0"
                                variant="outlined" density="compact" hide-details
                                :rules="[v => v >= 0 || 'Must be non-negative']"
                                @keydown="e => { if (e.key === '-') e.preventDefault() }" />
                        </v-col>
                        <v-col cols="6" sm="3" class="mt-3">
                            <v-label class="text-caption font-weight-medium mb-1">Consultation Fee</v-label>
                            <v-text-field v-model.number="form.consultation_fee" type="number" min="0" prefix="$"
                                variant="outlined" density="compact" hide-details
                                :rules="[v => v >= 0 || 'Must be non-negative']"
                                @keydown="e => { if (e.key === '-') e.preventDefault() }" />
                        </v-col>
                        <v-col cols="12" class="mt-3">
                            <v-label class="text-caption font-weight-medium mb-1">Biography</v-label>
                            <v-textarea v-model="form.biography" placeholder="Short biography" variant="outlined"
                                density="compact" rows="2" hide-details />
                        </v-col>
                        <v-col cols="12" class="mt-3">
                            <v-switch v-model="form.is_available" color="success" label="Available for consultation"
                                hide-details density="compact" />
                        </v-col>
                    </template>

                    <!-- Nurse-specific fields -->
                    <template v-if="form.role === 'nurse'">
                        <v-col cols="12" class="mt-4">
                            <v-divider />
                            <div class="text-subtitle-2 font-weight-bold mt-3 mb-2">Nurse Details</div>
                        </v-col>
                        <v-col cols="12" sm="6" class="mt-1">
                            <v-label class="text-caption font-weight-medium mb-1">Department / Poli</v-label>
                            <v-select v-model="form.department_id" :items="departments" item-title="name"
                                item-value="id" placeholder="Select department" variant="outlined" density="compact"
                                hide-details clearable />
                        </v-col>
                        <v-col cols="12" sm="6" class="mt-1">
                            <v-label class="text-caption font-weight-medium mb-1">Phone</v-label>
                            <v-text-field v-model="form.phone" placeholder="e.g. 081234567890" variant="outlined"
                                density="compact" hide-details type="tel" inputmode="numeric"
                                @keydown="e => { if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Delete' && e.key !== 'End' && e.key !== 'Home') e.preventDefault() }" />
                        </v-col>
                        <v-col cols="12" sm="6" class="mt-3">
                            <v-label class="text-caption font-weight-medium mb-1">Experience (years)</v-label>
                            <v-text-field v-model.number="form.experience_years" type="number" min="0"
                                variant="outlined" density="compact" hide-details
                                :rules="[v => v >= 0 || 'Must be non-negative']"
                                @keydown="e => { if (e.key === '-') e.preventDefault() }" />
                        </v-col>
                        <v-col cols="12" class="mt-3">
                            <v-switch v-model="form.is_available" color="success" label="Available for duty"
                                hide-details density="compact" />
                        </v-col>
                    </template>

                    <!-- Patient-specific fields -->
                    <template v-if="form.role === 'patient'">
                        <v-col cols="12" class="mt-4">
                            <v-divider />
                            <div class="text-subtitle-2 font-weight-bold mt-3 mb-2">Patient Details</div>
                        </v-col>
                        <v-col cols="12" sm="6" class="mt-1">
                            <v-label class="text-caption font-weight-medium mb-1">Date of Birth</v-label>
                            <v-text-field v-model="form.date_of_birth" type="date" variant="outlined" density="compact"
                                hide-details />
                        </v-col>
                        <v-col cols="12" sm="6" class="mt-1">
                            <v-label class="text-caption font-weight-medium mb-1">Gender</v-label>
                            <v-select v-model="form.gender" :items="genderOptions" placeholder="Select gender"
                                variant="outlined" density="compact" hide-details clearable />
                        </v-col>
                        <v-col cols="12" sm="6" class="mt-3">
                            <v-label class="text-caption font-weight-medium mb-1">Phone</v-label>
                            <v-text-field v-model="form.phone" placeholder="e.g. 081234567890" variant="outlined"
                                density="compact" hide-details type="tel" inputmode="numeric"
                                @keydown="e => { if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Delete' && e.key !== 'End' && e.key !== 'Home') e.preventDefault() }" />
                        </v-col>
                        <v-col cols="12" sm="6" class="mt-3">
                            <v-label class="text-caption font-weight-medium mb-1">Blood Type</v-label>
                            <v-select v-model="form.blood_type" :items="bloodTypes" placeholder="Select blood type"
                                variant="outlined" density="compact" hide-details clearable />
                        </v-col>
                        <v-col cols="12" class="mt-3">
                            <v-label class="text-caption font-weight-medium mb-1">Address</v-label>
                            <v-textarea v-model="form.address" placeholder="Patient address" variant="outlined"
                                density="compact" rows="2" hide-details />
                        </v-col>
                        <v-col cols="12" class="mt-3">
                            <v-label class="text-caption font-weight-medium mb-1">Room</v-label>
                            <v-text-field v-model="form.room" placeholder="e.g. 12A" variant="outlined"
                                density="compact" hide-details />
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
            <v-btn variant="flat" :color="config.confirmColor" :loading="loading" :disabled="loading"
                :style="loading ? 'cursor: not-allowed; pointer-events: auto;' : ''" @click="onSubmit">
                {{ config.confirmLabel }}
            </v-btn>
        </v-card-actions>
    </v-card>
</template>
