<script setup lang="ts">
import usePharmacyWorkspace from '~/composables/usePharmacyWorkspace'

const workspace = usePharmacyWorkspace()
const noteDialog = ref(false)
const selectedId = ref<string | null>(null)
const pharmacistNote = ref('')

const pendingPrescriptions = computed(() => workspace.prescriptions.value.filter((item) => item.status === 'Pending'))

function openNote(id: string) {
    selectedId.value = id
    pharmacistNote.value = ''
    noteDialog.value = true
}

function saveNote() {
    if (!selectedId.value) return
    workspace.addPrescriptionNote(selectedId.value, pharmacistNote.value.trim())
    noteDialog.value = false
}

function verifyPrescription(id: string) {
    workspace.updatePrescriptionStatus(id, 'Verified', 'Verified by pharmacist.')
}

function returnToDoctor(id: string) {
    workspace.updatePrescriptionStatus(id, 'Rejected', 'Returned to doctor for review.')
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex flex-wrap align-center justify-space-between ga-3">
            <div>
                <div class="text-caption text-uppercase text-medium-emphasis">Pharmacy Operations</div>
                <v-card-title class="text-h4">Prescription Verification</v-card-title>
                <v-card-subtitle class="mt-1">
                    Review pending prescriptions, add pharmacist notes, and decide whether to verify or return them.
                </v-card-subtitle>
            </div>
        </div>
    </v-card-item>

    <v-row>
        <v-col v-for="item in pendingPrescriptions" :key="item.id" cols="12" lg="6">
            <v-card elevation="0" class="h-100 pharmacy-card">
                <v-card-text class="d-flex flex-column ga-3">
                    <div class="d-flex align-start justify-space-between ga-3">
                        <div>
                            <div class="text-h6">{{ item.patientName }}</div>
                            <div class="text-body-2 text-medium-emphasis">{{ item.mrn }} · {{ item.doctorName }}</div>
                        </div>
                        <v-chip size="small" variant="tonal" color="warning">
                            Pending
                        </v-chip>
                    </div>

                    <div>
                        <div class="text-caption text-medium-emphasis">Medicines</div>
                        <div class="d-flex flex-wrap ga-2 mt-1">
                            <v-chip v-for="medicine in item.medicines" :key="medicine" size="small" variant="tonal" color="primary">
                                {{ medicine }}
                            </v-chip>
                        </div>
                    </div>

                    <div>
                        <div class="text-caption text-medium-emphasis">Note</div>
                        <div class="text-body-2">{{ item.note }}</div>
                    </div>

                    <div>
                        <div class="text-caption text-medium-emphasis">Pharmacist Note</div>
                        <div class="text-body-2">{{ item.pharmacistNote || '-' }}</div>
                    </div>

                    <div class="d-flex flex-wrap ga-2 justify-end">
                        <v-btn size="small" color="success" variant="flat" @click="verifyPrescription(item.id)">
                            Verify Prescription
                        </v-btn>
                        <v-btn size="small" color="secondary" variant="tonal" @click="openNote(item.id)">
                            Add Pharmacist Note
                        </v-btn>
                        <v-btn size="small" color="error" variant="text" @click="returnToDoctor(item.id)">
                            Return to Doctor
                        </v-btn>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>

    <v-card v-if="pendingPrescriptions.length === 0" elevation="0">
        <v-card-text class="py-10 text-center text-medium-emphasis">
            No pending prescriptions found.
        </v-card-text>
    </v-card>

    <v-dialog v-model="noteDialog" max-width="560">
        <v-card>
            <v-card-title class="text-h6">Add Pharmacist Note</v-card-title>
            <v-card-text>
                <v-textarea
                    v-model="pharmacistNote"
                    label="Note"
                    rows="4"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Add verification comments for the doctor or file"
                />
            </v-card-text>
            <v-card-actions class="justify-end">
                <v-btn variant="text" @click="noteDialog = false">Cancel</v-btn>
                <v-btn color="primary" variant="flat" @click="saveNote">Save Note</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style scoped>
.pharmacy-card {
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: none;
}
</style>
