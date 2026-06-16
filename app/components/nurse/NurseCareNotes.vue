<script setup lang="ts">
type NursePatientOption = {
    id: string
    full_name: string
    medical_record_number: string
}

type NurseCareNote = {
    id: string
    patient_id: string
    patient_name: string
    medical_record_number: string
    category: string
    note: string
    author_name: string | null
    recorded_at: string
}

const { data: patientData, pending: patientPending } = await useFetch<{ patients: NursePatientOption[] }>('/api/nurse/patients')
const { data: noteData, pending, refresh } = await useFetch<{ notes: NurseCareNote[] }>('/api/nurse/care-notes')

const patientOptions = computed(() =>
    (patientData.value?.patients ?? []).map((patient) => ({
        title: `${patient.full_name} • ${patient.medical_record_number}`,
        value: patient.id,
    })),
)

const recentCareNotes = computed(() => noteData.value?.notes ?? [])
const historySearch = ref('')
const historyPatientFilter = ref('all')
const historyCategoryFilter = ref('all')
const editingNoteId = ref<string | null>(null)
const deleteDialog = ref(false)
const selectedNote = ref<NurseCareNote | null>(null)
const submitting = ref(false)

const categoryOptions = [
    { title: 'All categories', value: 'all' },
    { title: 'Observation', value: 'Observation' },
    { title: 'Medication', value: 'Medication' },
    { title: 'Wound Care', value: 'Wound Care' },
    { title: 'Education', value: 'Education' },
    { title: 'Other', value: 'Other' },
]

const historyPatientOptions = computed(() => [
    { title: 'All patients', value: 'all' },
    ...patientOptions.value,
])

const filteredCareNotes = computed(() => {
    const keyword = historySearch.value.trim().toLowerCase()

    return recentCareNotes.value.filter((note) => {
        const matchPatient = historyPatientFilter.value === 'all' || note.patient_id === historyPatientFilter.value
        const matchCategory = historyCategoryFilter.value === 'all' || note.category === historyCategoryFilter.value
        const matchSearch =
            !keyword ||
            note.patient_name.toLowerCase().includes(keyword) ||
            note.medical_record_number.toLowerCase().includes(keyword) ||
            note.category.toLowerCase().includes(keyword) ||
            note.author_name?.toLowerCase().includes(keyword) ||
            note.note.toLowerCase().includes(keyword)

        return matchPatient && matchCategory && matchSearch
    })
})

const form = reactive({
    patientId: '',
    category: 'Observation',
    note: '',
    authorName: 'Nurse',
})

watch(
    patientOptions,
    (options) => {
        if (!form.patientId && options[0]?.value) {
            form.patientId = options[0].value
        }
    },
    { immediate: true },
)

function resetForm() {
    form.patientId = patientOptions.value[0]?.value ?? ''
    form.category = 'Observation'
    form.note = ''
    form.authorName = 'Nurse'
    editingNoteId.value = null
}

function startEdit(note: NurseCareNote) {
    editingNoteId.value = note.id
    form.patientId = note.patient_id
    form.category = note.category
    form.note = note.note
    form.authorName = note.author_name ?? 'Nurse'
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

function askDelete(note: NurseCareNote) {
    selectedNote.value = note
    deleteDialog.value = true
}

async function submitNote() {
    if (!form.patientId || !form.note.trim() || submitting.value) return

    submitting.value = true

    try {
        await $fetch('/api/nurse/care-notes', {
            method: editingNoteId.value ? 'PUT' : 'POST',
            body: editingNoteId.value
                ? {
                      id: editingNoteId.value,
                      patient_id: form.patientId,
                      category: form.category,
                      note: form.note,
                      author_name: form.authorName,
                  }
                : {
                      patient_id: form.patientId,
                      category: form.category,
                      note: form.note,
                      author_name: form.authorName,
                  },
        })

        resetForm()
        await refresh()
    } finally {
        submitting.value = false
    }
}

async function deleteSelectedNote() {
    if (!selectedNote.value || submitting.value) return

    submitting.value = true

    try {
        await $fetch('/api/nurse/care-notes', {
            method: 'DELETE',
            body: { id: selectedNote.value.id },
        })

        deleteDialog.value = false
        selectedNote.value = null
        await refresh()
    } finally {
        submitting.value = false
    }
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })
}
</script>

<template>
    <div>
    <v-row>
        <v-col cols="12" lg="5">
            <v-card elevation="0" class="h-100">
                <v-card-item class="pb-2">
                    <v-card-title class="text-h5">{{ editingNoteId ? 'Edit Care Note' : 'Care Notes' }}</v-card-title>
                    <v-card-subtitle>Add shift progress notes</v-card-subtitle>
                </v-card-item>
                <v-divider />
                <v-card-text>
                    <v-form class="d-flex flex-column ga-4" @submit.prevent="submitNote">
                        <v-autocomplete
                            v-model="form.patientId"
                            :items="patientOptions"
                            :loading="patientPending"
                            item-title="title"
                            item-value="value"
                            label="Patient"
                            placeholder="Search patient..."
                            variant="outlined"
                            density="comfortable"
                            clearable
                        />
                        <v-select
                            v-model="form.category"
                            :items="categoryOptions"
                            item-title="title"
                            item-value="value"
                            label="Category"
                            variant="outlined"
                            density="comfortable"
                        />
                        <v-text-field v-model="form.authorName" label="Note author" variant="outlined" density="comfortable" />
                        <v-textarea v-model="form.note" label="Note content" rows="4" variant="outlined" density="comfortable" />
                        <div class="d-flex ga-2 flex-wrap">
                            <v-btn type="submit" color="primary" variant="flat" size="large" :loading="submitting">
                                {{ editingNoteId ? 'Update note' : 'Save note' }}
                            </v-btn>
                            <v-btn v-if="editingNoteId" variant="tonal" color="secondary" size="large" @click="resetForm">
                                Cancel edit
                            </v-btn>
                        </div>
                    </v-form>
                </v-card-text>
            </v-card>
        </v-col>
        <v-col cols="12" lg="7">
            <v-card elevation="0" class="h-100">
                <v-card-item class="pb-2">
                    <v-card-title class="text-h5">Note History</v-card-title>
                    <v-card-subtitle>Latest patient care notes</v-card-subtitle>
                </v-card-item>
                <v-divider />
                <v-card-text class="pa-4">
                    <v-row dense>
                        <v-col cols="12" md="5">
                            <v-text-field
                                v-model="historySearch"
                                density="comfortable"
                                hide-details
                                clearable
                                label="Search history"
                                placeholder="Search patient, category, author, or note..."
                                prepend-inner-icon="mdi-magnify"
                                variant="outlined"
                            />
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-autocomplete
                                v-model="historyPatientFilter"
                                :items="historyPatientOptions"
                                density="comfortable"
                                hide-details
                                item-title="title"
                                item-value="value"
                                label="Filter by patient"
                                placeholder="Search patient..."
                                variant="outlined"
                                clearable
                            />
                        </v-col>
                        <v-col cols="12" md="3">
                            <v-select
                                v-model="historyCategoryFilter"
                                :items="categoryOptions"
                                density="comfortable"
                                hide-details
                                item-title="title"
                                item-value="value"
                                label="Category"
                                variant="outlined"
                            />
                        </v-col>
                    </v-row>
                </v-card-text>
                <v-divider />
                <v-card-text class="d-flex flex-column ga-3">
                    <v-card
                        v-for="note in filteredCareNotes"
                        :key="note.id"
                        class="note-history-card"
                        variant="outlined"
                        rounded="lg"
                    >
                        <v-card-text class="pa-4">
                            <div class="d-flex align-start justify-space-between ga-4">
                                <div class="min-w-0 flex-grow-1">
                                    <div class="d-flex align-center ga-2 flex-wrap mb-1">
                                        <div class="text-body-1 font-weight-semibold text-truncate">{{ note.patient_name }}</div>
                                        <v-chip size="x-small" variant="tonal" color="primary" label>
                                            {{ note.category }}
                                        </v-chip>
                                    </div>
                                    <div class="text-caption text-medium-emphasis">
                                        {{ note.medical_record_number }} • {{ note.author_name ?? 'Nurse' }}
                                    </div>
                                </div>
                                <div class="text-caption text-medium-emphasis text-no-wrap">
                                    {{ formatDate(note.recorded_at) }}
                                </div>
                            </div>

                            <div class="mt-3 text-body-2 note-history-content">
                                {{ note.note }}
                            </div>

                            <div class="d-flex justify-end ga-2 mt-3">
                                <v-btn size="small" variant="text" color="secondary" prepend-icon="mdi-pencil-outline" @click="startEdit(note)">
                                    Edit
                                </v-btn>
                                <v-btn size="small" variant="text" color="error" prepend-icon="mdi-delete-outline" @click="askDelete(note)">
                                    Delete
                                </v-btn>
                            </div>
                        </v-card-text>
                    </v-card>

                    <div v-if="pending" class="text-center py-8">
                        <v-progress-circular indeterminate color="primary" />
                    </div>
                    <div v-else-if="filteredCareNotes.length === 0" class="text-center py-8 text-medium-emphasis">
                        No care notes yet
                    </div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>

    <v-dialog v-model="deleteDialog" max-width="420">
        <v-card>
            <v-card-title class="text-h6">Delete note?</v-card-title>
            <v-card-text>
                This note will be removed permanently.
            </v-card-text>
            <v-card-actions class="justify-end">
                <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
                <v-btn color="error" variant="flat" :loading="submitting" @click="deleteSelectedNote">Delete</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
    </div>
</template>

<style scoped>
.note-history-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.note-history-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
}

.note-history-content {
    white-space: pre-wrap;
    line-height: 1.6;
}
</style>
