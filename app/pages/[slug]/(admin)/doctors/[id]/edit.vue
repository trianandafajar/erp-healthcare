<script setup lang="ts">
definePageMeta({
    layout: 'default',
    middleware: ['auth', 'permission'],
    permissions: ['doctor.edit'],
})

const route = useRoute()
const slug = route.params.slug as string
const id = route.params.id as string

const { data, pending } = await useFetch(`/api/doctors/${id}`)

const doctor = computed(() => data.value)
const profile = computed(() => doctor.value?.profiles)

const { data: departmentsData } = await useFetch('/api/departments')
const departments = computed(() => departmentsData.value?.departments ?? [])

const saving = ref(false)
const savingSchedule = ref(false)
const deletingScheduleId = ref<string | null>(null)
const snackbar = ref({ show: false, message: '', color: 'success' })
const photoFile = ref<File | null>(null)
const photoPreview = ref('')
const uploadingPhoto = ref(false)
const photoError = ref('')
const photoInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const form = reactive({
    specialization: '',
    sip_number: '',
    str_number: '',
    phone: '',
    department_id: '',
    biography: '',
    experience_years: null as number | null,
    consultation_fee: null as number | null,
    is_available: true,
})

const schedules = ref<any[]>([])

const DAY_NAMES = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
]

const newSchedule = reactive({
    day_of_week: null as number | null,
    start_time: '',
    end_time: '',
    max_patients: null as number | null,
})

const showAddSchedule = ref(false)

// Populate form saat data loaded
watch(data, (val) => {
    if (!val) return
    form.specialization = val.specialization ?? ''
    form.sip_number = val.sip_number ?? ''
    form.str_number = val.str_number ?? ''
    form.phone = val.phone ?? ''
    form.department_id = val.departments?.id ?? ''
    form.biography = val.biography ?? ''
    form.experience_years = val.experience_years ?? null
    form.consultation_fee = val.consultation_fee ?? null
    form.is_available = val.is_available ?? true
    schedules.value = val.active_schedules ?? []
    photoPreview.value = profile.value?.avatar_url ?? ''
    photoFile.value = null
    photoError.value = ''
}, { immediate: true })

function getInitials(name?: string | null) {
    if (!name) return '?'
    return name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
}

function formatTime(timeStr?: string | null) {
    if (!timeStr) return '-'
    return timeStr.slice(0, 5)
}

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
            '/api/upload/doctor-photo',
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

async function saveProfile() {
    saving.value = true

    try {
        if (photoFile.value) {
            await uploadPhoto()
        }

        await $fetch(`/api/doctors/${id}`, {
            method: 'PATCH' as any,
            body: {
                specialization: form.specialization || null,
                sip_number: form.sip_number || null,
                str_number: form.str_number || null,
                phone: form.phone || null,
                department_id: form.department_id || null,
                biography: form.biography || null,
                experience_years: form.experience_years,
                consultation_fee: form.consultation_fee,
                is_available: form.is_available,
            },
        })

        notify('Doctor profile updated')
        await navigateTo(`/${slug}/doctors/${id}`)
    }
    catch (e: any) {
        notify(e?.data?.message ?? 'Failed to save', 'error')
    }
    finally {
        saving.value = false
    }
}

async function addSchedule() {
    if (newSchedule.day_of_week === null || !newSchedule.start_time || !newSchedule.end_time) return
    savingSchedule.value = true
    try {
        const { data: created } = await $fetch<any>(`/api/doctors/${id}/schedules`, {
            method: 'POST',
            body: {
                day_of_week: newSchedule.day_of_week,
                start_time: newSchedule.start_time,
                end_time: newSchedule.end_time,
                max_patients: newSchedule.max_patients,
            },
        })
        schedules.value.push(created)
        schedules.value.sort((a, b) => a.day_of_week - b.day_of_week)
        Object.assign(newSchedule, { day_of_week: null, start_time: '', end_time: '', max_patients: null })
        showAddSchedule.value = false
        notify('Schedule added')
    } catch (e: any) {
        notify(e?.data?.message ?? 'Failed to add schedule', 'error')
    } finally {
        savingSchedule.value = false
    }
}

async function deleteSchedule(scheduleId: string) {
    deletingScheduleId.value = scheduleId
    try {
        await $fetch(`/api/doctors/${id}/schedules/${scheduleId}`, { method: 'DELETE' })
        schedules.value = schedules.value.filter((s) => s.id !== scheduleId)
        notify('Schedule removed')
    } catch (e: any) {
        notify(e?.data?.message ?? 'Failed to remove schedule', 'error')
    } finally {
        deletingScheduleId.value = null
    }
}
</script>

<template>
    <div v-if="pending" class="text-center py-16">
        <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <div v-else-if="!doctor" class="text-center py-16 text-medium-emphasis">
        <v-icon icon="mdi-doctor" size="48" class="mb-3 d-block mx-auto" />
        Doctor not found
    </div>

    <template v-else>
        <!-- Header -->
        <v-card variant="flat" class="mb-4 p-12">
            <v-card-item class="pa-5">
                <div class="d-flex align-center ga-4">
                    <v-btn icon="mdi-arrow-left" variant="text" @click="navigateTo(`/${slug}/doctors/${id}`)" />
                    <v-avatar size="48" color="primary" variant="tonal">
                        <v-img v-if="profile?.avatar_url" :src="profile.avatar_url" cover />
                        <span v-else class="text-body-1 font-weight-bold">
                            {{ getInitials(profile?.full_name) }}
                        </span>
                    </v-avatar>
                    <div>
                        <div class="text-h6 font-weight-bold">{{ profile?.full_name ?? '-' }}</div>
                        <div class="text-caption text-medium-emphasis">Edit doctor profile</div>
                    </div>
                </div>
            </v-card-item>
        </v-card>

        <v-row>
            <!-- Kolom kiri: Professional + Availability -->
            <v-col cols="12" md="8">

                <!-- Professional Info -->
                <v-card variant="flat" class="mb-4">
                    <v-card-item>
                        <template #prepend>
                            <v-avatar color="primary" variant="tonal" size="36">
                                <v-icon icon="mdi-stethoscope" size="20" />
                            </v-avatar>
                        </template>
                        <v-card-title class="text-body-1">Professional Information</v-card-title>
                    </v-card-item>
                    <v-divider />
                    <v-card-text class="pa-5">
                        <v-row>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="form.specialization" label="Specialization" variant="outlined"
                                    density="comfortable" prepend-inner-icon="mdi-medical-bag" />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-select v-model="form.department_id" :items="departments" item-title="name"
                                    item-value="id" label="Department" variant="outlined" density="comfortable"
                                    prepend-inner-icon="mdi-hospital-building" clearable />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="form.sip_number" label="SIP Number" variant="outlined"
                                    density="comfortable" prepend-inner-icon="mdi-card-account-details" inputmode="numeric"
                                    @keydown="e => { if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Delete' && e.key !== 'End' && e.key !== 'Home') e.preventDefault() }" />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="form.phone" label="Phone" variant="outlined"
                                    density="comfortable" prepend-inner-icon="mdi-phone" type="tel" inputmode="numeric"
                                    @keydown="e => { if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Delete' && e.key !== 'End' && e.key !== 'Home') e.preventDefault() }" />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model.number="form.experience_years" label="Experience (years)"
                                    type="number" variant="outlined" density="comfortable"
                                    prepend-inner-icon="mdi-briefcase" min="0"
                                    :rules="[v => v >= 0 || 'Must be non-negative']"
                                    @keydown="e => { if (e.key === '-') e.preventDefault() }"
                                    @update:model-value="val => { if (Number(val) < 0) form.experience_years = 0 }" />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model.number="form.consultation_fee" label="Consultation Fee (USD)"
                                    type="number" variant="outlined" density="comfortable" prepend-inner-icon="mdi-cash"
                                    min="0" :rules="[v => v >= 0 || 'Must be non-negative']"
                                    @keydown="e => { if (e.key === '-') e.preventDefault() }"
                                    @update:model-value="val => { if (Number(val) < 0) form.consultation_fee = 0 }" />
                            </v-col>
                            <v-col cols="12">
                                <v-textarea v-model="form.biography" label="Biography" variant="outlined"
                                    density="comfortable" rows="4" prepend-inner-icon="mdi-text-account" auto-grow />
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>

                <!-- Schedules -->
                <v-card variant="flat">
                    <v-card-item>
                        <template #prepend>
                            <v-avatar color="info" variant="tonal" size="36">
                                <v-icon icon="mdi-calendar-clock" size="20" />
                            </v-avatar>
                        </template>
                        <v-card-title class="text-body-1">Practice Schedules</v-card-title>
                        <template #append>
                            <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-plus"
                                @click="showAddSchedule = true">
                                Add
                            </v-btn>
                        </template>
                    </v-card-item>
                    <v-divider />

                    <!-- Add schedule form -->
                    <v-expand-transition>
                        <div v-if="showAddSchedule">
                            <v-card-text class="pa-4">
                                <v-row align="center">
                                    <v-col cols="12" sm="3">
                                        <v-select v-model="newSchedule.day_of_week"
                                            :items="DAY_NAMES.map((name, i) => ({ title: name, value: i }))"
                                            item-title="title" item-value="value" label="Day" variant="outlined"
                                            density="comfortable" hide-details />
                                    </v-col>
                                    <v-col cols="6" sm="2">
                                        <v-text-field v-model="newSchedule.start_time" label="Start" type="time"
                                            variant="outlined" density="comfortable" hide-details />
                                    </v-col>
                                    <v-col cols="6" sm="2">
                                        <v-text-field v-model="newSchedule.end_time" label="End" type="time"
                                            variant="outlined" density="comfortable" hide-details />
                                    </v-col>
                                    <v-col cols="6" sm="2">
                                        <v-text-field v-model.number="newSchedule.max_patients" label="Max patients"
                                            type="number" variant="outlined" density="comfortable" hide-details
                                            min="1" :rules="[v => v >= 1 || 'Must be at least 1']"
                                            @keydown="e => { if (e.key === '-' || e.key === '.') e.preventDefault() }" />
                                    </v-col>
                                    <v-col cols="6" sm="3" class="d-flex ga-2">
                                        <v-btn color="primary" variant="tonal" :loading="savingSchedule"
                                            :disabled="newSchedule.day_of_week === null || !newSchedule.start_time || !newSchedule.end_time"
                                            :style="newSchedule.day_of_week === null || !newSchedule.start_time || !newSchedule.end_time ? 'cursor: not-allowed; pointer-events: auto;' : ''"
                                            @click="addSchedule">
                                            Save
                                        </v-btn>
                                        <v-btn variant="text" @click="showAddSchedule = false">Cancel</v-btn>
                                    </v-col>
                                </v-row>
                            </v-card-text>
                            <v-divider />
                        </div>
                    </v-expand-transition>

                    <!-- Schedule list -->
                    <v-list v-if="schedules.length" density="comfortable">
                        <v-list-item v-for="schedule in schedules" :key="schedule.id">
                            <template #prepend>
                                <v-avatar color="primary" variant="tonal" size="36">
                                    <v-icon icon="mdi-calendar-week" size="18" />
                                </v-avatar>
                            </template>
                            <v-list-item-title class="font-weight-medium">
                                {{ DAY_NAMES[schedule.day_of_week] }}
                            </v-list-item-title>
                            <v-list-item-subtitle>
                                {{ formatTime(schedule.start_time) }} – {{ formatTime(schedule.end_time) }}
                                <span v-if="schedule.max_patients" class="ml-2 text-medium-emphasis">
                                    · Max {{ schedule.max_patients }} patients
                                </span>
                            </v-list-item-subtitle>
                            <template #append>
                                <v-btn icon="mdi-trash-can-outline" variant="text" color="error" size="small"
                                    :loading="deletingScheduleId === schedule.id"
                                    @click="deleteSchedule(schedule.id)" />
                            </template>
                        </v-list-item>
                    </v-list>

                    <v-card-text v-else class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-calendar-blank" size="32" class="mb-2 d-block mx-auto" />
                        No active schedules yet
                    </v-card-text>
                </v-card>

            </v-col>

            <!-- kanan -->
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

                <v-card variant="flat" class="mb-4">
                    <v-card-item>
                        <template #prepend>
                            <v-avatar color="warning" variant="tonal" size="36">
                                <v-icon icon="mdi-certificate" size="20" />
                            </v-avatar>
                        </template>
                        <v-card-title class="text-body-1">License Number</v-card-title>
                    </v-card-item>
                    <v-divider />
                    <v-card-text class="pa-5">
                        <v-text-field v-model="form.str_number" label="STR Number" variant="outlined"
                            density="comfortable" prepend-inner-icon="mdi-shield-check" inputmode="numeric"
                            @keydown="e => { if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Delete' && e.key !== 'End' && e.key !== 'Home') e.preventDefault() }" />
                    </v-card-text>
                </v-card>
                <v-card variant="flat" class="mb-4">
                    <v-card-item>
                        <template #prepend>
                            <v-avatar color="success" variant="tonal" size="36">
                                <v-icon icon="mdi-check-circle" size="20" />
                            </v-avatar>
                        </template>
                        <v-card-title class="text-body-1">Availability</v-card-title>
                    </v-card-item>
                    <v-divider />
                    <v-card-text class="pa-5">
                        <v-switch v-model="form.is_available" color="success" label="Doctor is available" hide-details
                            inset />
                        <div class="text-caption text-medium-emphasis mt-2">
                            When turned off, the doctor won't appear in appointment booking.
                        </div>
                    </v-card-text>
                </v-card>
                <!-- Save button -->
                <v-card variant="flat">
                    <v-card-text class="pa-5">
                        <v-btn block color="primary" size="large" prepend-icon="mdi-content-save" :loading="saving"
                            @click="saveProfile">
                            Save Changes
                        </v-btn>
                        <v-btn block variant="tonal" class="mt-2" @click="navigateTo(`/${slug}/doctors/${id}`)">
                            Cancel
                        </v-btn>
                    </v-card-text>
                </v-card>

            </v-col>
        </v-row>

        <!-- Snackbar -->
        <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="bottom right" :timeout="3000">
            {{ snackbar.message }}
        </v-snackbar>
    </template>
</template>

<style scoped>
.photo-dropzone {
    height: 88px;
    border: 2px dashed rgba(var(--v-border-color), .4);
    cursor: pointer;
    transition: .2s;
    text-align: center;
}

.photo-dropzone:hover {
    border-color: rgb(var(--v-theme-primary));
    background: rgba(var(--v-theme-primary), .04);
}

.photo-dropzone--dragging {
    border-color: rgb(var(--v-theme-primary));
    background: rgba(var(--v-theme-primary), .08);
}

.photo-dropzone--error {
    border-color: rgb(var(--v-theme-error));
}
</style>