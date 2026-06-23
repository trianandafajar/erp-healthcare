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

type ViewTab = 'card' | 'list'

const route = useRoute()
const router = useRouter()

const { can } = usePermission()

const { data: patientData, pending: patientPending } = useLazyFetch<{ patients: NursePatientOption[] }>('/api/nurse/patients')
const { data: noteData, pending, refresh } = useLazyFetch<{ notes: NurseCareNote[] }>('/api/nurse/care-notes')

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
const viewTab = ref<ViewTab>('card')
const dialog = ref(false)
const editingNoteId = ref<string | null>(null)
const selectedNote = ref<NurseCareNote | null>(null)
const deleteDialog = ref(false)
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

function normalizeTab(tab: string | string[] | undefined) {
    const value = Array.isArray(tab) ? tab[0] : tab
    return value === 'list' ? 'list' : 'card'
}

watch(
    () => route.query.tab,
    (tab) => {
        viewTab.value = normalizeTab(tab)
    },
    { immediate: true },
)

watch(viewTab, (tab) => {
    if (!import.meta.client) return

    const currentTab = normalizeTab(route.query.tab)
    if (currentTab !== tab) {
        router.replace({
            query: {
                ...route.query,
                tab,
            },
        })
    }
})

onMounted(() => {
    if (!import.meta.client) return

    const currentTab = normalizeTab(route.query.tab)
    if (route.query.tab === undefined || currentTab !== viewTab.value) {
        router.replace({
            query: {
                ...route.query,
                tab: viewTab.value,
            },
        })
    }
})

function openAddDialog() {
    editingNoteId.value = null
    resetForm()
    dialog.value = true
}

function resetForm() {
    form.patientId = patientOptions.value[0]?.value ?? ''
    form.category = 'Observation'
    form.note = ''
    form.authorName = 'Nurse'
}

function startEdit(note: NurseCareNote) {
    editingNoteId.value = note.id
    form.patientId = note.patient_id
    form.category = note.category
    form.note = note.note
    form.authorName = note.author_name ?? 'Nurse'
    dialog.value = true
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

        dialog.value = false
        editingNoteId.value = null
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

function closeDialog() {
    dialog.value = false
    editingNoteId.value = null
    resetForm()
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex flex-wrap align-center justify-space-between ga-3">
            <div>
                <div class="text-caption text-uppercase text-medium-emphasis">Nurse Care</div>
                <v-card-title class="text-h4">Care Note History</v-card-title>
                <v-card-subtitle class="mt-1">Latest patient care notes from the database.</v-card-subtitle>
            </div>
            <v-btn v-if="can('care-notes.create')" color="primary" variant="flat" size="large" prepend-icon="mdi-plus"
                density="comfortable" @click="openAddDialog">
                Create Care Note
            </v-btn>
        </div>
    </v-card-item>
    <v-card elevation="0">
        <v-card-text class="d-flex flex-column ga-4">
            <div class="d-flex flex-wrap align-center gap-3">
                <v-text-field v-model="historySearch" density="comfortable" hide-details clearable
                    label="Search history" placeholder="Search patient, category, author, or note..."
                    prepend-inner-icon="mdi-magnify" variant="outlined" class="care-filter-field" />
                <v-autocomplete v-model="historyPatientFilter" :items="historyPatientOptions" density="comfortable"
                    hide-details item-title="title" item-value="value" label="Filter by patient"
                    placeholder="Search patient..." variant="outlined" clearable class="care-filter-field" />
                <v-select v-model="historyCategoryFilter" :items="categoryOptions" density="comfortable" hide-details
                    item-title="title" item-value="value" label="Filter by category" variant="outlined"
                    class="care-filter-field care-filter-category" />
            </div>
            <v-tabs v-model="viewTab" color="primary" density="comfortable" class="care-tabs-header" grow>
                <v-tab value="card">Card</v-tab>
                <v-tab value="list">List</v-tab>
            </v-tabs>

            <v-window v-model="viewTab">
                <v-window-item value="card">
                    <v-row dense>
                        <v-col v-if="pending" cols="12" class="text-center py-8">
                            <v-progress-circular indeterminate color="primary" />
                        </v-col>
                        <v-col v-else-if="filteredCareNotes.length === 0" cols="12"
                            class="text-center py-8 text-medium-emphasis">
                            No care notes yet
                        </v-col>
                        <v-col v-for="note in filteredCareNotes" :key="note.id" cols="12" md="6">
                            <v-card class="care-note-card h-100" variant="flat" rounded="lg">
                                <v-card-text class="pa-4">
                                    <div class="d-flex align-start justify-space-between ga-4">
                                        <div class="min-w-0 flex-grow-1">
                                            <div class="d-flex align-center ga-2 flex-wrap mb-1">
                                                <div class="text-body-1 font-weight-semibold text-truncate">
                                                    {{ note.patient_name }}
                                                </div>
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

                                    <div class="mt-3 text-body-2 care-note-content">
                                        {{ note.note }}
                                    </div>

                                    <div class="d-flex justify-end ga-2 mt-3">
                                        <v-btn size="small" variant="text" color="secondary"
                                            prepend-icon="mdi-pencil-outline" @click="startEdit(note)">
                                            Edit
                                        </v-btn>
                                        <v-btn size="small" variant="text" color="error"
                                            prepend-icon="mdi-delete-outline" @click="askDelete(note)">
                                            Delete
                                        </v-btn>
                                    </div>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-window-item>

                <v-window-item value="list">
                    <v-table hover density="comfortable">
                        <thead class="bg-containerBg">
                            <tr>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Patient</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Category</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Note</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Time</th>
                                <th class="text-right text-caption font-weight-bold text-uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="pending">
                                <td colspan="5" class="text-center py-8">
                                    <v-progress-circular indeterminate color="primary" />
                                </td>
                            </tr>
                            <tr v-else-if="filteredCareNotes.length === 0">
                                <td colspan="5" class="text-center py-8 text-medium-emphasis">
                                    No care notes yet
                                </td>
                            </tr>
                            <tr v-else v-for="note in filteredCareNotes" :key="note.id">
                                <td class="py-3">
                                    <div class="text-body-2 font-weight-medium">{{ note.patient_name }}</div>
                                    <div class="text-caption text-medium-emphasis">{{ note.medical_record_number }}
                                    </div>
                                </td>
                                <td class="py-3">
                                    <v-chip size="small" variant="tonal" color="primary" label>
                                        {{ note.category }}
                                    </v-chip>
                                </td>
                                <td class="py-3 text-body-2 care-note-table-note">
                                    {{ note.note }}
                                </td>
                                <td class="py-3 text-body-2 text-medium-emphasis">
                                    {{ formatDate(note.recorded_at) }}
                                </td>
                                <td class="py-3 text-right">
                                    <v-btn v-if="can('care-notes.edit')" icon="mdi-pencil-outline" variant="text"
                                        size="small" color="secondary" @click="startEdit(note)" />
                                    <v-btn v-if="can('care-notes.delete')" icon="mdi-delete-outline" variant="text"
                                        size="small" color="error" @click="askDelete(note)" />
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-window-item>
            </v-window>
        </v-card-text>
    </v-card>

    <v-dialog v-model="dialog" max-width="700">
        <v-card>
            <v-card-title class="text-h6">
                {{ editingNoteId ? 'Edit Care Note' : 'Create Care Note' }}
            </v-card-title>
            <v-card-text>
                <v-form class="d-flex flex-column ga-4" @submit.prevent="submitNote">
                    <v-autocomplete v-model="form.patientId" :items="patientOptions" :loading="patientPending"
                        item-title="title" item-value="value" label="Patient" placeholder="Search patient..."
                        variant="outlined" density="comfortable" clearable />
                    <v-select v-model="form.category" :items="categoryOptions" item-title="title" item-value="value"
                        label="Category" variant="outlined" density="comfortable" />
                    <v-text-field v-model="form.authorName" label="Note author" variant="outlined"
                        density="comfortable" />
                    <v-textarea v-model="form.note" label="Note content" rows="4" variant="outlined"
                        density="comfortable" />
                    <div class="d-flex ga-2 justify-end">
                        <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
                        <v-btn type="submit" color="primary" variant="flat" :loading="submitting">
                            {{ editingNoteId ? 'Update' : 'Save' }}
                        </v-btn>
                    </div>
                </v-form>
            </v-card-text>
        </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="420">
        <v-card>
            <v-card-title class="text-h6">Delete note?</v-card-title>
            <v-card-text>This note will be removed permanently.</v-card-text>
            <v-card-actions class="justify-end">
                <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
                <v-btn color="error" variant="flat" :loading="submitting" @click="deleteSelectedNote">Delete</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style scoped>
.care-filter-field {
    min-width: 220px;
    flex: 1 1 240px;
}

.care-tabs-header {
    min-width: 280px;
    max-width: 360px;
    align-self: flex-start;
}

.care-filter-category {
    max-width: 260px;
}

.care-note-card {
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: none;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.care-note-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.04);
}

.care-note-content {
    white-space: pre-wrap;
    line-height: 1.6;
}

.care-note-table-note {
    max-width: 420px;
    white-space: pre-wrap;
}
</style>
