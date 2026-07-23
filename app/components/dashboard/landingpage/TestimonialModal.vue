<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Testimonial {
    id: string
    name: string
    role: string
    institution: string
    quote: string
    rating: number
    image_url: string
    is_active?: boolean // tambahan
}

const props = defineProps<{
    mode: 'add' | 'edit' | 'delete'
    testimonial?: Testimonial | null
    loading?: boolean
}>()

const emit = defineEmits<{
    (e: 'submit', data: any): void
    (e: 'cancel'): void
}>()

const form = ref({
    name: '',
    role: '',
    institution: '',
    quote: '',
    rating: 5,
    image_url: '',
    is_active: true, // default aktif
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
    form.value.image_url = ''
    if (photoInputRef.value) photoInputRef.value.value = ''
}

async function uploadPhoto(): Promise<string> {
    if (!photoFile.value) return form.value.image_url

    uploadingPhoto.value = true
    try {
        const body = new FormData()
        body.append('file', photoFile.value)

        const result = await $fetch<{ url: string }>(
            '/api/upload/testimonial-photo',
            { method: 'POST', body }
        )

        form.value.image_url = result.url
        return result.url
    } finally {
        uploadingPhoto.value = false
    }
}

watch(
    () => props.testimonial,
    (testimonial) => {
        if (props.mode === 'edit' && testimonial) {
            form.value = {
                name: testimonial.name,
                role: testimonial.role,
                institution: testimonial.institution,
                quote: testimonial.quote,
                rating: testimonial.rating,
                image_url: testimonial.image_url,
                is_active: testimonial.is_active ?? true,
            }
            photoPreview.value = testimonial.image_url || ''
            photoFile.value = null
            photoError.value = ''
        } else {
            form.value = {
                name: '',
                role: '',
                institution: '',
                quote: '',
                rating: 5,
                image_url: '',
                is_active: true,
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
        title: 'Add Testimonial',
        icon: 'mdi-account-plus-outline',
        confirmColor: 'primary',
        confirmLabel: 'Create Testimonial',
    },
    edit: {
        title: 'Edit Testimonial',
        icon: 'mdi-pencil-outline',
        confirmColor: 'primary',
        confirmLabel: 'Save Changes',
    },
    delete: {
        title: 'Delete Testimonial',
        icon: 'mdi-delete-outline',
        confirmColor: 'error',
        confirmLabel: 'Delete Testimonial',
    },
}[props.mode]))

async function onSubmit() {
    if (props.mode === 'delete') {
        emit('submit', { id: props.testimonial?.id })
        return
    }

    try {
        if (photoFile.value) {
            await uploadPhoto()
        }

        emit('submit', {
            id: props.testimonial?.id,
            name: form.value.name,
            role: form.value.role,
            institution: form.value.institution,
            quote: form.value.quote,
            rating: form.value.rating,
            image_url: form.value.image_url,
            is_active: form.value.is_active,
        })
    } catch (err: any) {
        photoError.value = err?.data?.message ?? err?.message ?? 'Failed to upload photo.'
    }
}
</script>

<template>
    <v-card rounded="lg" max-width="540" width="100%">
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
                            Are you sure you want to delete this testimonial?
                        </p>
                        <p class="text-body-2 text-medium-emphasis mt-1">
                            <strong>{{ testimonial?.name }}</strong> from <strong>{{ testimonial?.institution }}</strong> will be permanently removed.
                        </p>
                    </div>
                </div>
            </v-card-text>
        </template>

        <template v-else>
            <v-card-text class="pa-4" style="max-height: 440px; overflow-y: auto;">
                <v-row dense>
                    <v-col cols="12">
                        <v-label class="text-caption font-weight-medium mb-1">Name</v-label>
                        <v-text-field v-model="form.name" placeholder="e.g. Dr. Andi Pratama" variant="outlined"
                            density="compact" hide-details="auto" />
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Role</v-label>
                        <v-text-field v-model="form.role" placeholder="e.g. Director" variant="outlined"
                            density="compact" hide-details />
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Institution</v-label>
                        <v-text-field v-model="form.institution" placeholder="e.g. RS Pusat Jakarta" variant="outlined"
                            density="compact" hide-details />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Quote</v-label>
                        <v-textarea v-model="form.quote" placeholder="Testimonial quote..." variant="outlined"
                            density="compact" rows="3" hide-details />
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Rating (1-5)</v-label>
                        <v-select v-model.number="form.rating" :items="[1,2,3,4,5]" variant="outlined"
                            density="compact" hide-details />
                    </v-col>

                    <!-- Tambahan Switch Status Aktif -->
                    <v-col cols="12" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Status</v-label>
                        <v-switch
                            v-model="form.is_active"
                            :label="form.is_active ? 'Active' : 'Inactive'"
                            color="success"
                            hide-details
                        />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Profile Image</v-label>
                        <div class="d-flex ga-3 align-stretch">
                            <v-avatar size="80" rounded="lg" color="grey-lighten-3" class="flex-shrink-0">
                                <v-img v-if="photoPreview" :src="photoPreview" cover />
                                <v-icon v-else icon="mdi-account-outline" size="40" color="grey-lighten-1" />
                            </v-avatar>

                            <div class="photo-dropzone flex-grow-1 d-flex flex-column align-center justify-center ga-1 rounded-lg"
                                :class="{
                                    'photo-dropzone--dragging': isDragging,
                                    'photo-dropzone--error': !!photoError
                                }" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop"
                                @click="triggerFileInput">
                                <v-icon :icon="isDragging ? 'mdi-cloud-download-outline' : 'mdi-account-plus-outline'"
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
                                Remove image
                            </v-btn>
                        </div>
                    </v-col>
                </v-row>
            </v-card-text>
        </template>

        <v-divider />

        <v-card-actions class="pa-4 pt-3">
            <v-spacer />
            <v-btn variant="tonal" color="secondary" :disabled="loading || uploadingPhoto"
                @click="emit('cancel')">Cancel</v-btn>
            <v-btn variant="flat" :color="config.confirmColor" :loading="loading || uploadingPhoto"
                :disabled="loading || uploadingPhoto"
                :style="loading || uploadingPhoto ? 'cursor: not-allowed; pointer-events: auto;' : ''"
                @click="onSubmit">
                {{ config.confirmLabel }}
            </v-btn>
        </v-card-actions>
    </v-card>
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