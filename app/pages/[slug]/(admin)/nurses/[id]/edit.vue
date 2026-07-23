<script setup lang="ts">
definePageMeta({
    layout: 'default',
    middleware: ['auth', 'permission'],
    permissions: ['nurse.edit'],
})

const route = useRoute()
const slug = route.params.slug as string
const id = route.params.id as string

const { data, pending } = await useFetch(`/api/nurses/${id}`)
const nurse = computed(() => data.value)
const profile = computed(() => data.value?.profiles)

const { data: deptData } = await useFetch('/api/departments')
const departments = computed(() => deptData.value?.departments ?? [])
const photoPreview = ref('')
const photoFile = ref<File | null>(null)
const photoError = ref('')
const photoInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const uploadingPhoto = ref(false)
const saving = ref(false)
const snackbar = ref({ show: false, message: '', color: 'success' })

const form = reactive({
    phone: '',
    department_id: null as string | null,
    experience_years: null as number | null,
    is_available: true,
})

watch(data, (val: any) => {
    if (!val) return
    form.phone = val.phone ?? ''
    form.department_id = val.departments?.id ?? null
    form.experience_years = val.experience_years ?? null
    form.is_available = val.is_available ?? true
    photoPreview.value = profile.value?.avatar_url ?? ''
    photoFile.value = null
    photoError.value = ''
}, { immediate: true })

function notify(message: string, color = 'success') {
    snackbar.value = { show: true, message, color }
}

function triggerFileInput() {
    photoInputRef.value?.click()
}

function validateFile(file: File): string | null {
    const allowed = [
        'image/jpeg',
        'image/png',
        'image/webp',
    ]

    if (!allowed.includes(file.type))
        return 'Only JPG, PNG, or WebP images are allowed.'

    if (file.size > 2 * 1024 * 1024)
        return 'Image must be smaller than 2 MB.'

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

    if (photoPreview.value.startsWith('blob:'))
        URL.revokeObjectURL(photoPreview.value)

    photoPreview.value = URL.createObjectURL(file)
}

function onFileInputChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]

    if (file)
        applyFile(file)
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

    if (file)
        applyFile(file)
}

function removePhoto() {
    if (photoPreview.value.startsWith('blob:'))
        URL.revokeObjectURL(photoPreview.value)

    photoPreview.value = ''
    photoFile.value = null
    photoError.value = ''

    if (photoInputRef.value)
        photoInputRef.value.value = ''
}

async function uploadPhoto() {
    if (!photoFile.value) return

    uploadingPhoto.value = true

    try {
        const body = new FormData()

        body.append('file', photoFile.value)
        body.append('profile_id', id)

        const result = await $fetch<{ url: string }>(
            '/api/upload/nurse-photo',
            {
                method: 'POST',
                body,
            }
        )

        photoPreview.value = result.url
    }
    finally {
        uploadingPhoto.value = false
    }
}

async function save() {
    saving.value = true
    try {
        if (photoFile.value) {
            await uploadPhoto()
        }

        await $fetch(`/api/nurses/${id}`, {
            method: 'PATCH' as any,
            body: {
                phone: form.phone || null,
                department_id: form.department_id || null,
                experience_years: form.experience_years ?? null,
                is_available: form.is_available,
            },
        })
        notify('Nurse profile updated')
        await navigateTo(`/${slug}/nurses/${id}`)
    } catch (e: any) {
        notify(e?.data?.message ?? 'Failed to save', 'error')
    } finally {
        saving.value = false
    }
}

function getInitials(name?: string | null) {
    if (!name) return '?'
    return name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
}
</script>

<template>
    <div v-if="pending" class="text-center py-16">
        <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <template v-else>
        <!-- Header -->
        <v-card variant="flat" class="mb-4">
            <v-card-item class="pa-5">
                <div class="d-flex align-center ga-4">
                    <v-btn icon="mdi-arrow-left" variant="text" @click="navigateTo(`/${slug}/nurses/${id}`)" />
                    <v-avatar size="48" color="primary" variant="tonal">
                        <v-img v-if="profile?.avatar_url" :src="profile.avatar_url" cover />
                        <span v-else class="text-body-1 font-weight-bold">
                            {{ getInitials(profile?.full_name) }}
                        </span>
                    </v-avatar>
                    <div>
                        <div class="text-h6 font-weight-bold">
                            {{ profile?.full_name ?? 'Edit Nurse' }}
                        </div>
                        <div class="text-caption text-medium-emphasis">Edit nurse profile</div>
                    </div>
                </div>
            </v-card-item>
        </v-card>

        <v-row>
            <v-col cols="12" md="8">
                <!-- Nurse Information -->
                <v-card variant="flat" class="mb-4">
                    <v-card-item>
                        <template #prepend>
                            <v-avatar color="primary" variant="tonal" size="36">
                                <v-icon icon="mdi-account-heart" size="20" />
                            </v-avatar>
                        </template>
                        <v-card-title class="text-body-1">Nurse Information</v-card-title>
                    </v-card-item>
                    <v-divider />
                    <v-card-text class="pa-5">
                        <v-row>
                            <!-- Read-only name -->
                            <v-col cols="12">
                                <v-label class="text-caption font-weight-medium mb-1">Full Name</v-label>
                                <v-text-field :model-value="profile?.full_name ?? ''" variant="outlined"
                                    density="compact" hide-details prepend-inner-icon="mdi-account" readonly disabled />
                                <div class="text-caption text-medium-emphasis mt-1">
                                    Name is managed through the user profile and cannot be changed here.
                                </div>
                            </v-col>

                            <!-- Read-only email -->
                            <v-col cols="12" class="mt-3">
                                <v-label class="text-caption font-weight-medium mb-1">Email</v-label>
                                <v-text-field :model-value="profile?.email ?? ''" variant="outlined" density="compact"
                                    hide-details prepend-inner-icon="mdi-email-outline" readonly disabled />
                            </v-col>

                            <!-- Phone -->
                            <v-col cols="12" sm="6" class="mt-3">
                                <v-label class="text-caption font-weight-medium mb-1">
                                    Phone
                                    <span class="text-medium-emphasis font-weight-regular">(optional)</span>
                                </v-label>
                                <v-text-field v-model="form.phone" placeholder="e.g. +62 812 3456 7890"
                                    variant="outlined" density="compact" hide-details
                                    prepend-inner-icon="mdi-phone-outline" />
                            </v-col>

                            <!-- Experience years -->
                            <v-col cols="12" sm="6" class="mt-3">
                                <v-label class="text-caption font-weight-medium mb-1">
                                    Experience (years)
                                    <span class="text-medium-emphasis font-weight-regular">(optional)</span>
                                </v-label>
                                <v-text-field v-model.number="form.experience_years" placeholder="e.g. 5" type="number"
                                    min="0" variant="outlined" density="compact" hide-details
                                    prepend-inner-icon="mdi-briefcase-clock-outline"
                                    :rules="[v => v >= 0 || 'Must be non-negative']"
                                    @keydown="e => { if (e.key === '-') e.preventDefault() }"
                                    @update:model-value="val => { if (Number(val) < 0) form.experience_years = 0 }" />
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>

                <!-- Assignment -->
                <v-card variant="flat">
                    <v-card-item>
                        <template #prepend>
                            <v-avatar color="secondary" variant="tonal" size="36">
                                <v-icon icon="mdi-hospital-building" size="20" />
                            </v-avatar>
                        </template>
                        <v-card-title class="text-body-1">Assignment</v-card-title>
                    </v-card-item>
                    <v-divider />
                    <v-card-text class="pa-5">
                        <v-row>
                            <v-col cols="12">
                                <v-label class="text-caption font-weight-medium mb-1">
                                    Department
                                    <span class="text-medium-emphasis font-weight-regular">(optional)</span>
                                </v-label>
                                <v-autocomplete v-model="form.department_id" :items="departments" item-value="id"
                                    item-title="name" placeholder="Select department..." variant="outlined"
                                    density="compact" hide-details clearable prepend-inner-icon="mdi-hospital-building">
                                    <template #item="{ props, item }">
                                        <v-list-item v-bind="props">
                                            <template #append>
                                                <v-chip v-if="item.raw.code" size="x-small" variant="tonal"
                                                    color="secondary" label>
                                                    {{ item.raw.code }}
                                                </v-chip>
                                            </template>
                                        </v-list-item>
                                    </template>
                                </v-autocomplete>
                            </v-col>

                            <v-col cols="12" class="mt-3">
                                <v-label class="text-caption font-weight-medium mb-1">Availability</v-label>
                                <v-card variant="outlined" :color="form.is_available ? 'success' : undefined"
                                    class="pa-4 cursor-pointer" @click="form.is_available = !form.is_available">
                                    <div class="d-flex align-center justify-space-between">
                                        <div class="d-flex align-center ga-3">
                                            <v-icon :icon="form.is_available ? 'mdi-check-circle' : 'mdi-close-circle'"
                                                :color="form.is_available ? 'success' : 'error'" size="24" />
                                            <div>
                                                <div class="text-body-2 font-weight-medium">
                                                    {{ form.is_available ? 'Available' : 'Unavailable' }}
                                                </div>
                                                <div class="text-caption text-medium-emphasis">
                                                    {{ form.is_available
                                                        ? 'Nurse is available for patient assignments'
                                                        : 'Nurse is not currently available' }}
                                                </div>
                                            </div>
                                        </div>
                                        <v-switch v-model="form.is_available" hide-details color="success"
                                            @click.stop />
                                    </div>
                                </v-card>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>
            </v-col>

            <!-- Actions -->
            <v-col cols="12" md="4">
                <v-card variant="flat" class="mb-4">
                    <v-card-item>
                        <template #prepend>
                            <v-avatar color="success" variant="tonal" size="36">
                                <v-icon icon="mdi-account" />
                            </v-avatar>
                        </template>

                        <v-card-title class="text-body-1">
                            Profile Photo
                        </v-card-title>
                    </v-card-item>

                    <v-divider />

                    <v-card-text class="pa-5">

                        <div class="d-flex ga-3 align-stretch">

                            <v-avatar size="88" rounded="lg" color="grey-lighten-3">
                                <v-img v-if="photoPreview" :src="photoPreview" cover />

                                <span v-else class="text-h6 font-weight-bold">
                                    {{ getInitials(profile?.full_name) }}
                                </span>
                            </v-avatar>

                            <div class="photo-dropzone flex-grow-1 d-flex flex-column align-center justify-center ga-1 rounded-lg"
                                :class="{
                                    'photo-dropzone--dragging': isDragging,
                                    'photo-dropzone--error': !!photoError
                                }" @click="triggerFileInput" @dragover="onDragOver" @dragleave="onDragLeave"
                                @drop="onDrop">
                                <v-icon :icon="isDragging
                                    ? 'mdi-cloud-upload'
                                    : 'mdi-image-plus-outline'" size="24" />

                                <span class="text-caption font-weight-medium">
                                    {{ isDragging ? 'Drop image here' : 'Click or drag image' }}
                                </span>

                                <span class="text-caption text-medium-emphasis">
                                    JPG, PNG, WebP · Max 2 MB
                                </span>
                            </div>

                            <input ref="photoInputRef" type="file" accept="image/jpeg,image/png,image/webp" hidden
                                @change="onFileInputChange" />

                        </div>

                        <div v-if="photoError" class="text-error text-caption mt-2">
                            {{ photoError }}
                        </div>

                        <v-btn v-if="photoPreview" class="mt-2" size="small" color="error" variant="text"
                            prepend-icon="mdi-delete-outline" @click="removePhoto">
                            Remove photo
                        </v-btn>

                    </v-card-text>
                </v-card>

                <!-- Nurse summary card -->
                <v-card variant="flat" class="mb-4" v-if="nurse">
                    <v-card-item>
                        <template #prepend>
                            <v-avatar color="info" variant="tonal" size="36">
                                <v-icon icon="mdi-information-outline" size="20" />
                            </v-avatar>
                        </template>
                        <v-card-title class="text-body-1">Current Info</v-card-title>
                    </v-card-item>
                    <v-divider />
                    <v-list density="compact">
                        <v-list-item title="Nurse ID" :subtitle="id" />
                        <v-list-item title="Department" :subtitle="nurse.departments?.name ?? 'Not assigned'" />
                        <v-list-item title="Experience"
                            :subtitle="nurse.experience_years ? `${nurse.experience_years} years` : 'Not set'" />
                        <v-list-item title="Status">
                            <template #subtitle>
                                <v-chip :color="nurse.is_available ? 'success' : 'error'" size="x-small" variant="tonal"
                                    class="mt-1">
                                    {{ nurse.is_available ? 'Available' : 'Unavailable' }}
                                </v-chip>
                            </template>
                        </v-list-item>
                    </v-list>
                </v-card>

                <v-card variant="flat">
                    <v-card-text class="pa-5">
                        <v-btn block color="primary" size="large" prepend-icon="mdi-content-save" :loading="saving"
                            @click="save">
                            Save Changes
                        </v-btn>
                        <v-btn block variant="text" class="mt-2" @click="navigateTo(`/${slug}/nurses/${id}`)">
                            Cancel
                        </v-btn>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="bottom right" :timeout="3000">
            {{ snackbar.message }}
        </v-snackbar>
    </template>
</template>