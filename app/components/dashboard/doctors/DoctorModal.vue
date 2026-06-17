<script setup lang="ts">

interface Doctor {
    id: string
    full_name?: string
    email?: string
    specialization?: string
    str_number?: string
    sip_number?: string
    phone?: string
    photo_url?: string
    biography?: string
    experience_years?: number
    consultation_fee?: number
    is_available?: boolean
    department?: { id: string; name: string; code?: string } | null
}

interface AvailableUser {
    id: string
    full_name: string
    email: string
}

interface Department {
    id: string
    name: string
    code?: string
}

const props = defineProps<{
    mode: 'add' | 'edit' | 'delete'
    doctor?: Doctor | null
    availableUsers?: AvailableUser[]
    departments?: Department[]
    onCreateUser: (payload: {
        full_name: string
        email: string
    }) => Promise<{ id: string; full_name: string; email: string } | null>
}>()

const emit = defineEmits<{
    (e: 'submit', data: any): void
    (e: 'cancel'): void
}>()

const form = ref({
    id: '',
    department_id: null as string | null,
    specialization: '',
    str_number: '',
    sip_number: '',
    phone: '',
    photo_url: '',
    biography: '',
    experience_years: 0,
    consultation_fee: 0,
    is_available: true,
})

const createUserDialog = ref(false)
const creatingUser = ref(false)

const createUserForm = ref({
    full_name: '',
    email: '',
})

function openCreateUserDialog() {
    createUserForm.value = { full_name: '', email: '' }
    createUserDialog.value = true
}

async function submitCreateUser() {
    creatingUser.value = true
    try {
        const newUser = await props.onCreateUser({ ...createUserForm.value })

        if (newUser?.id) {
            form.value.id = newUser.id
            createUserDialog.value = false
            createUserForm.value = { full_name: '', email: '' }
        }
        // if newUser is null (failed), keep dialog open so user can retry
    } finally {
        creatingUser.value = false
    }
}

watch(
    () => props.doctor,
    (doctor) => {
        if (doctor && props.mode === 'edit') {
            form.value = {
                id: doctor.id,
                department_id: doctor.department?.id ?? null,
                specialization: doctor.specialization ?? '',
                str_number: doctor.str_number ?? '',
                sip_number: doctor.sip_number ?? '',
                phone: doctor.phone ?? '',
                photo_url: doctor.photo_url ?? '',
                biography: doctor.biography ?? '',
                experience_years: doctor.experience_years ?? 0,
                consultation_fee: doctor.consultation_fee ?? 0,
                is_available: doctor.is_available ?? true,
            }
        } else if (props.mode === 'add') {
            form.value = {
                id: '',
                department_id: null,
                specialization: '',
                str_number: '',
                sip_number: '',
                phone: '',
                photo_url: '',
                biography: '',
                experience_years: 0,
                consultation_fee: 0,
                is_available: true,
            }
        }
    },
    { immediate: true }
)

const config = computed(() => ({
    add: {
        title: 'Add New Doctor',
        icon: 'mdi-doctor',
        confirmColor: 'primary',
        confirmLabel: 'Create Doctor',
    },
    edit: {
        title: 'Edit Doctor',
        icon: 'mdi-pencil-outline',
        confirmColor: 'primary',
        confirmLabel: 'Save Changes',
    },
    delete: {
        title: 'Remove Doctor',
        icon: 'mdi-delete-outline',
        confirmColor: 'error',
        confirmLabel: 'Remove Doctor',
    },
}[props.mode]))

function onSubmit() {
    if (props.mode === 'delete') {
        emit('submit', {
            id: props.doctor?.id,
        })
        return
    }

    emit('submit', {
        ...form.value,
        id: props.mode === 'add' ? form.value.id : props.doctor?.id,
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
                            Are you sure you want to remove this doctor's profile?
                        </p>

                        <p class="text-body-2 text-medium-emphasis mt-1">
                            <strong>{{ doctor?.full_name }}</strong>
                            ({{ doctor?.email }})
                            will be removed from the doctors list. The user account itself will not be deleted.
                        </p>
                    </div>
                </div>
            </v-card-text>
        </template>

        <template v-else>
            <v-card-text class="pa-4" style="max-height: 520px; overflow-y: auto;">
                <v-row dense>
                    <v-col cols="12">
                        <v-label class="text-caption font-weight-medium mb-1">
                            User Account
                        </v-label>

                        <template v-if="mode === 'add'">
                            <div class="d-flex ga-2 align-start">
                                <v-select v-model="form.id" :items="availableUsers ?? []" item-title="full_name"
                                    item-value="id" placeholder="Select a doctor account" variant="outlined"
                                    density="compact" hide-details="auto" no-data-text="No available doctor accounts"
                                    class="flex-grow-1">
                                    <template #item="{ props: itemProps, item }">
                                        <v-list-item v-bind="itemProps" :subtitle="item.raw.email" />
                                    </template>
                                </v-select>

                                <v-btn color="primary" variant="tonal" prepend-icon="mdi-account-plus"
                                    @click="openCreateUserDialog">
                                    Create User
                                </v-btn>
                            </div>

                            <div class="text-caption text-medium-emphasis mt-1">
                                Create a new doctor account if it doesn't exist yet.
                            </div>
                        </template>

                        <v-text-field v-else :model-value="`${doctor?.full_name} (${doctor?.email})`" variant="outlined"
                            density="compact" hide-details disabled />
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Department / Poli
                        </v-label>

                        <v-select v-model="form.department_id" :items="departments ?? []" item-title="name"
                            item-value="id" placeholder="Select department" variant="outlined" density="compact"
                            hide-details clearable />
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Specialization
                        </v-label>

                        <v-text-field v-model="form.specialization" placeholder="e.g. Pediatrician" variant="outlined"
                            density="compact" hide-details />
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            STR Number
                        </v-label>

                        <v-text-field v-model="form.str_number" placeholder="Surat Tanda Registrasi" variant="outlined"
                            density="compact" hide-details />
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            SIP Number
                        </v-label>

                        <v-text-field v-model="form.sip_number" placeholder="Surat Izin Praktik" variant="outlined"
                            density="compact" hide-details />
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
                            Photo URL
                        </v-label>

                        <v-text-field v-model="form.photo_url" placeholder="https://..." variant="outlined"
                            density="compact" hide-details />
                    </v-col>

                    <v-col cols="6" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Experience (years)
                        </v-label>

                        <v-text-field v-model.number="form.experience_years" type="number" min="0" variant="outlined"
                            density="compact" hide-details />
                    </v-col>

                    <v-col cols="6" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Consultation Fee
                        </v-label>

                        <v-text-field v-model.number="form.consultation_fee" type="number" min="0" prefix="Rp"
                            variant="outlined" density="compact" hide-details />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Biography
                        </v-label>

                        <v-textarea v-model="form.biography" placeholder="Short biography" variant="outlined"
                            density="compact" rows="3" hide-details />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-switch v-model="form.is_available" color="success" label="Available for consultation"
                            hide-details density="compact" />
                    </v-col>
                </v-row>
            </v-card-text>
        </template>

        <v-divider />

        <v-card-actions class="pa-4 pt-3">
            <v-spacer />

            <v-btn variant="tonal" color="secondary" @click="emit('cancel')">
                Cancel
            </v-btn>

            <v-btn variant="flat" :color="config.confirmColor" :disabled="mode === 'add' && !form.id" @click="onSubmit">
                {{ config.confirmLabel }}
            </v-btn>
        </v-card-actions>
    </v-card>

    <v-dialog v-model="createUserDialog" max-width="500">
        <v-card>
            <v-card-title>
                Create Doctor Account
            </v-card-title>

            <v-card-text>
                <v-text-field v-model="createUserForm.full_name" label="Full Name" variant="outlined" />

                <v-text-field v-model="createUserForm.email" label="Email" type="email" variant="outlined" />
            </v-card-text>

            <v-card-actions>
                <v-spacer />

                <v-btn variant="text" :disabled="creatingUser" @click="createUserDialog = false">
                    Cancel
                </v-btn>

                <v-btn color="primary" :loading="creatingUser" @click="submitCreateUser">
                    Create Account
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>