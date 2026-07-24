<script setup lang="ts">
interface Nurse {
    id: string
    full_name?: string
    email?: string
    phone?: string
    photo_url?: string
    experience_years?: number
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
    nurse?: Nurse | null
    availableUsers?: AvailableUser[]
    departments?: Department[]
    onCreateUser: (payload: {
        full_name: string
        email: string
    }) => Promise<{ id: string; full_name: string; email: string } | null>
    loading: boolean
}>()

const emit = defineEmits<{
    (e: 'submit', data: any): void
    (e: 'cancel'): void
}>()

const form = ref({
    id: '',
    department_id: null as string | null,
    phone: '',
    photo_url: '',
    experience_years: 0,
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
            '/api/upload/nurse-photo',
            {
                method: 'POST',
                body,
            }
        )

        form.value.photo_url = result.url
    } finally {
        uploadingPhoto.value = false
    }
    return form.value.photo_url
}

watch(
    () => props.nurse,
    (nurse) => {
        if (nurse && props.mode === 'edit') {
            form.value = {
                id: nurse.id,
                department_id: nurse.department?.id ?? null,
                phone: nurse.phone ?? '',
                photo_url: nurse.photo_url ?? '',
                experience_years: nurse.experience_years ?? 0,
                is_available: nurse.is_available ?? true,
            }
            photoPreview.value = nurse.photo_url ?? ''
            photoFile.value = null
        } else if (props.mode === 'add') {
            form.value = {
                id: '',
                department_id: null,
                phone: '',
                photo_url: '',
                experience_years: 0,
                is_available: true,
            }
            photoPreview.value = ''
            photoFile.value = null
            photoError.value = ''
        }
    },
    { immediate: true }
)

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
    } finally {
        creatingUser.value = false
    }
}

const config = computed(() => ({
    add: {
        title: 'Add New Nurse',
        icon: 'mdi-account-heart-outline',
        confirmColor: 'primary',
        confirmLabel: 'Create Nurse',
    },
    edit: {
        title: 'Edit Nurse',
        icon: 'mdi-pencil-outline',
        confirmColor: 'primary',
        confirmLabel: 'Save Changes',
    },
    delete: {
        title: 'Remove Nurse',
        icon: 'mdi-delete-outline',
        confirmColor: 'error',
        confirmLabel: 'Remove Nurse',
    },
}[props.mode]))

const submitting = ref(false)

async function onSubmit() {
    if (props.mode === 'delete') {
        emit('submit', { id: props.nurse?.id })
        return
    }

    submitting.value = true

    try {
        if (photoFile.value) {
            await uploadPhoto()
        }

        emit('submit', {
            ...form.value,
            id: props.mode === 'add'
                ? form.value.id
                : props.nurse?.id,
        })
    } catch (err: any) {
        photoError.value =
            err?.message ??
            'Failed to upload photo.'
    } finally {
        submitting.value = false
    }
}

const isSubmitDisabled = computed(() =>
    (props.mode === 'add' && (!form.value.id || !form.value.department_id)) || submitting.value
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
                            Are you sure you want to remove this nurse's profile?
                        </p>
                        <p class="text-body-2 text-medium-emphasis mt-1">
                            <strong>{{ nurse?.full_name }}</strong> ({{ nurse?.email }}) will be removed from the
                            nurses list. The user account itself will not be deleted.
                        </p>
                    </div>
                </div>
            </v-card-text>
        </template>

        <template v-else>
            <v-card-text class="pa-4" style="max-height: 520px; overflow-y: auto;">
                <v-row dense>
                    <v-col cols="12">
                        <v-label class="text-caption font-weight-medium mb-1">User Account</v-label>

                        <div v-if="mode === 'add'" class="d-flex ga-2 align-center">
                            <v-select v-model="form.id" :items="availableUsers ?? []" item-title="full_name"
                                item-value="id" placeholder="Select a user with nurse role" variant="outlined"
                                density="compact" hide-details="auto" no-data-text="No available users with nurse role"
                                class="flex-grow-1">
                                <template #item="{ props: itemProps, item }">
                                    <v-list-item v-bind="itemProps" :subtitle="item.raw.email" />
                                </template>
                            </v-select>

                            <v-btn color="primary" variant="tonal" prepend-icon="mdi-account-plus" height="40"
                                @click="openCreateUserDialog">
                                Create User
                            </v-btn>
                        </div>

                        <v-text-field v-else :model-value="`${nurse?.full_name} (${nurse?.email})`" variant="outlined"
                            density="compact" hide-details disabled />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Profile Photo</v-label>

                        <div class="d-flex ga-3 align-stretch">
                            <v-avatar size="80" rounded="lg" color="grey-lighten-3" class="flex-shrink-0">
                                <v-img v-if="photoPreview" :src="photoPreview" cover />
                                <v-icon v-else icon="mdi-account-heart-outline" size="40" color="grey-lighten-1" />
                            </v-avatar>

                            <div class="photo-dropzone flex-grow-1 d-flex flex-column align-center justify-center ga-1 rounded-lg"
                                :class="{ 'photo-dropzone--dragging': isDragging, 'photo-dropzone--error': !!photoError }"
                                @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop"
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
                        <v-select v-model="form.department_id" :items="departments ?? []" item-title="name"
                            item-value="id" placeholder="Select department" variant="outlined" density="compact"
                            hide-details :rules="[v => !!v || 'Department is required']" />
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Phone</v-label>
                        <v-text-field v-model="form.phone" placeholder="e.g. 081234567890" variant="outlined"
                            density="compact" hide-details type="tel" inputmode="numeric"
                            @keydown="e => { if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Delete' && e.key !== 'End' && e.key !== 'Home') e.preventDefault() }" />
                    </v-col>

                    <v-col cols="12" sm="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Experience (years)</v-label>
                         <v-text-field v-model.number="form.experience_years" type="number" min="0" variant="outlined"
                            density="compact" hide-details :rules="[v => v >= 0]"
                            @update:model-value="val => { if (Number(val) < 0) form.experience_years = 0 }"
                            @keydown="e => { if (e.key === '-') e.preventDefault() }" />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-switch v-model="form.is_available" color="success" label="Available for duty" hide-details
                            density="compact" />
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
            <v-btn variant="flat" :color="config.confirmColor" :loading="loading || submitting" :disabled="loading || submitting"
                :style="(loading || submitting) ? 'cursor: not-allowed; pointer-events: auto;' : ''" @click="onSubmit">
                {{ config.confirmLabel }}
            </v-btn>
        </v-card-actions>
    </v-card>

    <v-dialog v-model="createUserDialog" max-width="500">
        <v-card rounded="lg">
            <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
                <div class="d-flex align-center ga-2">
                    <v-icon icon="mdi-account-plus-outline" size="20" />
                    <span class="text-h6 font-weight-bold">Create Nurse Account</span>
                </div>
                <v-btn icon="mdi-close" variant="text" density="compact" :disabled="creatingUser"
                    @click="createUserDialog = false" />
            </v-card-title>

            <v-divider />

            <v-card-text class="pa-4">
                <v-row dense>
                    <v-col cols="12">
                        <v-label class="text-caption font-weight-medium mb-1">Full Name</v-label>
                        <v-text-field v-model="createUserForm.full_name" placeholder="Nurse John Doe" variant="outlined"
                            density="compact" hide-details />
                    </v-col>
                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Email Address</v-label>
                        <v-text-field v-model="createUserForm.email" placeholder="nurse@hospital.com" type="email"
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