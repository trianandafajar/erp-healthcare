<script setup lang="ts">
import useNurseWorkspace from '~/composables/useNurseWorkspace'

definePageMeta({
    layout: 'nurse',
    middleware: 'auth',
})

useSeoMeta({
    title: 'Care Notes',
    ogTitle: 'Care Notes',
    description: 'Patient observation and care action notes.',
})

const workspace = useNurseWorkspace()
const patientOptions = computed(() => workspace.patientOptions.value)
const recentCareNotes = computed(() => workspace.recentCareNotes.value.filter(Boolean))

const form = reactive({
    patientId: workspace.selectedPatientId.value || patientOptions.value[0]?.value || '',
    category: 'Observation',
    note: '',
    author: 'Nurse',
})

function submitNote() {
    if (!form.patientId || !form.note.trim()) return

    workspace.addCareNote({
        patientId: form.patientId,
        category: form.category,
        note: form.note,
        author: form.author,
    })

    form.note = ''
}
</script>

<template>
    <v-row>
        <v-col cols="12" lg="5">
            <v-card elevation="0">
                <v-card-item class="pb-2">
                    <v-card-title class="text-h5">Care Notes</v-card-title>
                    <v-card-subtitle>Add shift progress notes</v-card-subtitle>
                </v-card-item>

                <v-divider />

                <v-card-text>
                    <v-form @submit.prevent="submitNote" class="d-flex flex-column ga-4">
                        <v-select v-model="form.patientId" :items="patientOptions" item-title="title" item-value="value" label="Patient" variant="outlined" density="comfortable" />
                        <v-select v-model="form.category" :items="['Observation', 'Medication', 'Wound Care', 'Education', 'Other']" label="Category" variant="outlined" density="comfortable" />
                        <v-text-field v-model="form.author" label="Note author" variant="outlined" density="comfortable" />
                        <v-textarea v-model="form.note" label="Note content" rows="4" variant="outlined" density="comfortable" />
                        <v-btn type="submit" color="primary" variant="flat">Save note</v-btn>
                    </v-form>
                </v-card-text>
            </v-card>
        </v-col>

        <v-col cols="12" lg="7">
            <v-card elevation="0">
                <v-card-item class="pb-2">
                    <v-card-title class="text-h5">Note History</v-card-title>
                    <v-card-subtitle>Latest patient care notes</v-card-subtitle>
                </v-card-item>

                <v-divider />

                <v-card-text class="d-flex flex-column ga-4">
                    <v-card v-for="(note, index) in recentCareNotes" :key="note?.id ?? index" variant="tonal">
                        <template v-if="note">
                        <v-card-text>
                            <div class="d-flex align-center justify-space-between ga-3 mb-2">
                                <div>
                                    <div class="text-body-2 font-weight-medium">{{ note.patientName }}</div>
                                    <div class="text-caption text-medium-emphasis">{{ note.category }} - {{ note.author }}</div>
                                </div>
                                <div class="text-caption text-medium-emphasis">
                                    {{ new Date(note.createdAt).toLocaleString('en-US') }}
                                </div>
                            </div>
                            <div class="text-body-2">{{ note.note }}</div>
                        </v-card-text>
                        </template>
                    </v-card>

                    <div v-if="recentCareNotes.length === 0" class="text-center py-8 text-medium-emphasis">
                        No care notes yet
                    </div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>
</template>

