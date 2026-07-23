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
    mode: 'add' | 'delete'
    doctor?: Doctor | null
    availableUsers?: AvailableUser[]
    departments?: Department[]
    onCreateUser: (payload: {
        full_name: string
        email: string
    }) => Promise<{ id: string; full_name: string; email: string } | null>
    onCreateDepartment: (payload: {
        name: string
        code: string
    }) => Promise<{ id: string; name: string; code?: string } | null>
    loading?: boolean
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

const photoFile = ref<File | null>(null)
const photoPreview = ref<string>('')
const uploadingPhoto = ref(false)
const photoError = ref<string>('')
const photoInputRef = ref<HTMLInputElement | null>(null)

const isDragging = ref(false)

function triggerFileInput() {
    photoInputRef.value?.click()
}

function validateFile(file: File): string | null {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) return 'Only JPG, PNG, or WebP images are allowed.'
    if (file.size > 2 * 1024 * 1024) return 'Image must be smaller than 2 MB.'
    return null
}

function applyFile(file: File) {
    const err = validateFile(file)
    if (err) {
        photoError.value = err
        return
    }
    photoError.value = ''
    photoFile.value = file
    if (photoPreview.value.startsWith('blob:')) URL.revokeObjectURL(photoPreview.value)
    photoPreview.value = URL.createObjectURL(file)
}

function onFileInputChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) applyFile(file)
}

function onDragOver(event: DragEvent) {
    event.preventDefault()
    isDragging.value = true
}

function onDragLeave() {
    isDragging.value = false
}

function onDrop(event: DragEvent) {
    event.preventDefault()
    isDragging.value = false
    const file = event.dataTransfer?.files?.[0]
    if (file) applyFile(file)
}

function removePhoto() {
    if (photoPreview.value.startsWith('blob:')) URL.revokeObjectURL(photoPreview.value)
    photoFile.value = null
    photoPreview.value = ''
    photoError.value = ''
    form.value.photo_url = ''
    if (photoInputRef.value) photoInputRef.value.value = ''
}

async function uploadPhoto(): Promise<string> {
    if (!photoFile.value) return form.value.photo_url

    uploadingPhoto.value = true
    try {
        const body = new FormData()
        body.append('file', photoFile.value)
        body.append('profile_id', form.value.id)

        const result = await $fetch<{ url: string }>(
            '/api/upload/doctor-photo',
            {
                method: 'POST',
                body,
            }
        )

        form.value.photo_url = result.url
        return result.url
    } finally {
        uploadingPhoto.value = false
    }
}

const createUserDialog = ref(false)
const creatingUser = ref(false)
const createUserForm = ref({ full_name: '', email: '' })

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
    } finally {
        creatingUser.value = false
    }
}

const createDepartmentDialog = ref(false)
const creatingDepartment = ref(false)
const createDepartmentForm = ref({ name: '', code: '', description: '' })

function openCreateDepartmentDialog() {
    createDepartmentForm.value = { name: '', code: '', description: '' }
    createDepartmentDialog.value = true
}

async function submitCreateDepartment() {
    creatingDepartment.value = true
    try {
        const newDept = await props.onCreateDepartment({ ...createDepartmentForm.value })
        if (newDept?.id) {
            form.value.department_id = newDept.id
            createDepartmentDialog.value = false
            createDepartmentForm.value = { name: '', code: '', description: '' }
        }
    } finally {
        creatingDepartment.value = false
    }
}

watch(
    () => props.doctor,
    (doctor) => {
        if (props.mode === 'add') {
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
            photoPreview.value = ''
            photoFile.value = null
            photoError.value = ''
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
    delete: {
        title: 'Remove Doctor',
        icon: 'mdi-delete-outline',
        confirmColor: 'error',
        confirmLabel: 'Remove Doctor',
    },
}[props.mode]))

const submitting = ref(false)

async function onSubmit() {
    if (props.mode === 'delete') {
        emit('submit', { id: props.doctor?.id })
        return
    }

    try {
        if (photoFile.value) {
            await uploadPhoto()
        }

        emit('submit', {
            ...form.value,
            id: props.mode === 'add'
                ? form.value.id
                : props.doctor?.id,
        })
    } catch (err: any) {
        photoError.value =
            err?.message ??
            'Failed to upload photo.'
    }
}

const isSubmitDisabled = computed(() =>
    (props.mode === 'add' && !form.value.id) ||
    !!props.loading
)
</script>

<template>
    <v-card rounded="lg" max-width="600" width="100%">
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
                        <p class="text-body-1 font-weight-medium">
                            Are you sure you want to remove this doctor's profile?
                        </p>
                        <p class="text-body-2 text-medium-emphasis mt-1">
                            <strong>{{ doctor?.full_name }}</strong> ({{ doctor?.email }}) will be removed from the
                            doctors list. The user account itself will not be deleted.
                        </p>
                    </div>
                </div>
            </v-card-text>
        </template>

        <template v-else>
            <v-card-text class="pa-4" style="max-height: 540px; overflow-y: auto;">
                <v-row dense>
                    <v-col cols="12">
                        <v-label class="text-caption font-weight-medium mb-1">User Account</v-label>

                        <template v-if="mode === 'add'">
                            <div class="d-flex ga-2 align-center">
                                <v-autocomplete v-model="form.id" :items="availableUsers ?? []" item-title="full_name"
                                    item-value="id" placeholder="Search doctor account..." variant="outlined"
                                    density="compact" hide-details="auto" no-data-text="No matching doctor accounts"
                                    clearable class="flex-grow-1">
                                    <template #item="{ props: itemProps, item }">
                                        <v-list-item v-bind="itemProps" :subtitle="item.raw.email" />
                                    </template>
                                </v-autocomplete>

                                <v-btn color="primary" variant="tonal" prepend-icon="mdi-account-plus" height="40"
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

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Profile Photo</v-label>

                        <div class="d-flex ga-3 align-stretch">
                            <v-avatar size="80" rounded="lg" color="grey-lighten-3" class="flex-shrink-0">
                                <v-img v-if="photoPreview" :src="photoPreview" cover />
                                <v-icon v-else icon="mdi-doctor" size="40" color="grey-lighten-1" />
                            </v-avatar>

                            <div class="photo-dropzone flex-grow-1 d-flex flex-column align-center justify-center ga-1 rounded-lg"
                                :class="{
                                    'photo-dropzone--dragging': isDragging,
                                    'photo-dropzone--error': !!photoError
                                }" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop"
                                @click="triggerFileInput">
                                <v-icon :icon="isDragging ? 'mdi-cloud-download-outline' : 'mdi-image-plus-outline'"
                                    size="24" :color="isDragging ? 'primary' : 'grey'" />
                                <span class="text-caption font-weight-medium">
                                    {{ isDragging ? 'Drop to upload' : 'Click or drag & drop' }}
                                </span>
                                <span class="text-caption text-medium-emphasis">
                                    JPG, PNG, WebP · Max 2 MB
                                </span>
                            </div>

                            <input ref="photoInputRef" type="file" accept="image/jpeg,image/png,image/webp"
                                style="display: none" @change="onFileInputChange" />
                        </div>

                        <div v-if="photoError" class="text-caption text-error mt-1 d-flex align-center ga-1">
                            <v-icon icon="mdi-alert-circle-outline" size="14" />
                            {{ photoError }}
                        </div>

                        <div v-if="photoPreview" class="mt-2">
                            <v-btn variant="text" color="error" size="small" prepend-icon="mdi-delete-outline"
                                @click="removePhoto">
                                Remove photo
                            </v-btn>
                        </div>
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Department / Poli</v-label>
                        <div class="d-flex ga-2 align-center">

                            <v-autocomplete v-model="form.department_id" :items="departments ?? []" item-title="name"
                                item-value="id" placeholder="Search department..." variant="outlined" density="compact"
                                hide-details clearable class="flex-grow-1">
                                <template #item="{ props: itemProps, item }">
                                    <v-list-item v-bind="itemProps"
                                        :subtitle="item.raw.code ? `Code: ${item.raw.code}` : undefined" />
                                </template>
                            </v-autocomplete>

                            <v-tooltip text="Create new department" location="top">
                                <template #activator="{ props: tooltipProps }">
                                    <v-btn v-bind="tooltipProps" icon="mdi-plus" color="primary" variant="tonal"
                                        density="compact" size="40" @click="openCreateDepartmentDialog" />
                                </template>
                            </v-tooltip>
                        </div>
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Specialization</v-label>
                        <v-text-field v-model="form.specialization" placeholder="e.g. Pediatrician" variant="outlined"
                            density="compact" hide-details />
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">STR Number</v-label>
                        <v-text-field v-model="form.str_number" placeholder="Enter STR Number" variant="outlined"
                            density="compact" hide-details />
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">SIP Number</v-label>
                        <v-text-field v-model="form.sip_number" placeholder="Enter SIP number" variant="outlined"
                            density="compact" hide-details />
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Phone</v-label>
                        <v-text-field v-model="form.phone" placeholder="e.g. 081234567890" variant="outlined"
                            density="compact" hide-details />
                    </v-col>

                    <v-col cols="6" sm="3" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Experience (years)</v-label>
                        <v-text-field v-model.number="form.experience_years" type="number" min="0" variant="outlined"
                            density="compact" hide-details :rules="[v => v >= 0]"
                            @update:model-value="val => { if (Number(val) < 0) form.experience_years = 0 }"
                            @keydown="e => { if (e.key === '-') e.preventDefault() }" />
                    </v-col>

                    <v-col cols="6" sm="3" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Consultation Fee</v-label>
                        <v-text-field v-model.number="form.consultation_fee" type="number" min="0" prefix="$"
                            variant="outlined" density="compact" hide-details :rules="[v => v >= 0]"
                            @update:model-value="val => { if (Number(val) < 0) form.consultation_fee = 0 }"
                            @keydown="e => { if (e.key === '-') e.preventDefault() }" />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Biography</v-label>
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
            <v-btn variant="tonal" color="secondary" :disabled="loading" @click="emit('cancel')">
                Cancel
            </v-btn>
            <v-btn variant="flat" :color="config.confirmColor" :loading="loading" :disabled="loading"
                :style="loading ? 'cursor: not-allowed; pointer-events: auto;' : ''" @click="onSubmit">
                {{ config.confirmLabel }}
            </v-btn>
        </v-card-actions>
    </v-card>

    <v-dialog v-model="createUserDialog" max-width="500">
        <v-card rounded="lg">
            <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
                <div class="d-flex align-center ga-2">
                    <v-icon icon="mdi-account-plus-outline" size="20" />
                    <span class="text-h6 font-weight-bold">Create Doctor Account</span>
                </div>
                <v-btn icon="mdi-close" variant="text" density="compact" :disabled="creatingUser"
                    @click="createUserDialog = false" />
            </v-card-title>

            <v-divider />

            <v-card-text class="pa-4">
                <v-row dense>
                    <v-col cols="12">
                        <v-label class="text-caption font-weight-medium mb-1">Full Name</v-label>
                        <v-text-field v-model="createUserForm.full_name" placeholder="Dr. John Doe" variant="outlined"
                            density="compact" hide-details />
                    </v-col>
                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Email Address</v-label>
                        <v-text-field v-model="createUserForm.email" placeholder="doctor@hospital.com" type="email"
                            variant="outlined" density="compact" hide-details />
                    </v-col>
                </v-row>
            </v-card-text>

            <v-divider />

            <v-card-actions class="pa-4 pt-3">
                <v-spacer />
                <v-btn variant="tonal" color="secondary" :disabled="creatingUser" @click="createUserDialog = false">
                    Cancel
                </v-btn>
                <v-btn color="primary" variant="flat" :loading="creatingUser"
                    :disabled="!createUserForm.full_name || !createUserForm.email" @click="submitCreateUser">
                    Create Account
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="createDepartmentDialog" max-width="440">
        <v-card rounded="lg" width="100%">
            <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
                <div class="d-flex align-center ga-2">
                    <v-icon icon="mdi-hospital-building" size="20" />
                    <span class="text-h6 font-weight-bold">Create Department</span>
                </div>
                <v-btn icon="mdi-close" variant="text" density="compact" :disabled="creatingDepartment"
                    @click="createDepartmentDialog = false" />
            </v-card-title>

            <v-divider />

            <v-card-text class="pa-4">
                <v-row dense>
                    <v-col cols="12">
                        <v-label class="text-caption font-weight-medium mb-1">Department Name</v-label>
                        <v-text-field v-model="createDepartmentForm.name" placeholder="e.g. Pediatrics Clinic"
                            variant="outlined" density="compact" hide-details autofocus />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Code
                            <span class="text-medium-emphasis font-weight-regular">(optional)</span>
                        </v-label>
                        <v-text-field v-model="createDepartmentForm.code" placeholder="e.g. PED" variant="outlined"
                            density="compact" hide-details />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Description
                            <span class="text-medium-emphasis font-weight-regular">(optional)</span>
                        </v-label>
                        <v-textarea v-model="createDepartmentForm.description" placeholder="Optional" variant="outlined"
                            density="compact" rows="3" hide-details />
                    </v-col>
                </v-row>
            </v-card-text>

            <v-divider />

            <v-card-actions class="pa-4 pt-3">
                <v-spacer />
                <v-btn variant="tonal" color="secondary" :disabled="creatingDepartment"
                    @click="createDepartmentDialog = false">
                    Cancel
                </v-btn>
                <v-btn color="primary" variant="flat" :loading="creatingDepartment"
                    :disabled="!createDepartmentForm.name || creatingDepartment" @click="submitCreateDepartment">
                    Create & Select
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style scoped>
.photo-dropzone {
    height: 80px;
    min-height: 80px;
    border: 2px dashed rgba(var(--v-border-color), 0.4);
    cursor: pointer;
    transition: border-color 0.2s, background-color 0.2s;
    text-align: center;
    overflow: hidden;
}

.photo-dropzone:hover {
    border-color: rgb(var(--v-theme-primary));
    background-color: rgba(var(--v-theme-primary), 0.04);
}

.photo-dropzone--dragging {
    border-color: rgb(var(--v-theme-primary));
    background-color: rgba(var(--v-theme-primary), 0.08);
}

.photo-dropzone--error {
    border-color: rgb(var(--v-theme-error));
}
</style>