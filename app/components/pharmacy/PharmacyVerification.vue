<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePharmacyPrescriptions } from '~/composables/usePharmacyPrescriptions'
import type { PrescriptionItem } from '~/data/pharmacy'

const feed = usePharmacyPrescriptions()
const noteDialog = ref(false)
const selectedGroupId = ref<string | null>(null)
const pharmacistNote = ref('')
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref<'success' | 'error' | 'info'>('success')

const verifiedPrescriptions = computed(() => feed.groupedPrescriptions.value.filter((item) => item.status === 'Verified'))
const selectedGroup = computed(() => verifiedPrescriptions.value.find((item) => item.medicalRecordId === selectedGroupId.value) ?? null)
const isLoading = computed(() => feed.pending.value && verifiedPrescriptions.value.length === 0)

function formatDateTime(value: string | null | undefined) {
    if (!value) return '-'

    return new Date(value).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })
}

function notify(message: string, color: 'success' | 'error' | 'info' = 'success') {
    snackbarMsg.value = message
    snackbarColor.value = color
    snackbar.value = true
}

function openNote(groupId: string) {
    selectedGroupId.value = groupId
    pharmacistNote.value = ''
    noteDialog.value = true
}

async function updateGroupStatus(groupId: string, payload: { status: 'Verified' | 'Rejected' | 'Dispensed'; pharmacistNote?: string | null; rejectionNote?: string | null }) {
    const group = verifiedPrescriptions.value.find((item) => item.medicalRecordId === groupId)
    if (!group) return

    await Promise.all(group.items.map((item) => feed.setPrescriptionStatus(item.id, payload)))
}

async function saveNote() {
    if (!selectedGroupId.value) return

    const selected = selectedGroup.value
    if (!selected) return

    try {
        await Promise.all(
            selected.items.map((item) =>
                feed.setPrescriptionStatus(item.id, {
                    status: item.status,
                    pharmacistNote: pharmacistNote.value.trim(),
                }),
            ),
        )
        noteDialog.value = false
        notify('Pharmacist note saved', 'success')
    } catch (error: any) {
        notify(error?.data?.message ?? error?.message ?? 'Failed to save note', 'error')
    }
}

async function returnToDoctor(groupId: string) {
    try {
        await updateGroupStatus(groupId, {
            status: 'Rejected',
            pharmacistNote: 'Returned to doctor for review.',
            rejectionNote: 'Returned to doctor for review.',
        })
        notify('Prescription returned to doctor', 'info')
    } catch (error: any) {
        notify(error?.data?.message ?? error?.message ?? 'Failed to return prescription', 'error')
    }
}

async function markAsDispensed(groupId: string) {
    try {
        await updateGroupStatus(groupId, {
            status: 'Dispensed',
            pharmacistNote: 'Dispensed by pharmacy.',
        })
        notify('Prescription marked as dispensed', 'success')
    } catch (error: any) {
        notify(error?.data?.message ?? error?.message ?? 'Failed to dispense prescription', 'error')
    }
}

function medicineLabel(items: PrescriptionItem[]) {
    return items.map((item) => item.medicines.join(', ')).join(' • ')
}

function statusColor(status: PrescriptionItem['status']) {
    if (status === 'Pending') return 'primary'
    if (status === 'Verified') return 'success'
    if (status === 'Dispensed') return 'info'
    return 'error'
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex flex-wrap align-center justify-space-between ga-3">
            <div>
                <div class="text-caption text-uppercase text-medium-emphasis">Pharmacy Operations</div>
                <v-card-title class="text-h4">Prescription Verification</v-card-title>
                <v-card-subtitle class="mt-1">
                    Review verified prescriptions by patient visit, then decide whether to dispense or return them.
                </v-card-subtitle>
            </div>
        </div>
    </v-card-item>

    <v-alert v-if="feed.error.value" type="error" variant="tonal" density="comfortable" class="mb-4">
        {{ feed.error.value?.message || 'Unable to load prescriptions.' }}
    </v-alert>

    <v-row v-if="isLoading">
        <v-col v-for="index in 4" :key="index" cols="12" lg="6">
            <v-card elevation="0" class="pharmacy-skeleton-card h-100">
                <v-card-text class="d-flex flex-column ga-4">
                    <div class="d-flex align-start justify-space-between ga-3">
                        <div class="flex-grow-1">
                            <v-skeleton-loader type="heading" width="55%" class="mb-2" />
                            <v-skeleton-loader type="text" width="35%" />
                        </div>
                        <v-skeleton-loader type="chip" width="84" />
                    </div>

                    <div>
                        <v-skeleton-loader type="text" width="25%" class="mb-2" />
                        <div class="d-flex flex-wrap ga-2">
                            <v-skeleton-loader v-for="medicineIndex in 2" :key="medicineIndex" type="chip" width="110" />
                        </div>
                    </div>

                    <div>
                        <v-skeleton-loader type="text" width="18%" class="mb-2" />
                        <v-skeleton-loader type="paragraph" />
                    </div>

                    <div>
                        <v-skeleton-loader type="text" width="24%" class="mb-2" />
                        <v-skeleton-loader type="paragraph" />
                    </div>

                    <div class="d-flex justify-end ga-2">
                        <v-skeleton-loader v-for="actionIndex in 3" :key="actionIndex" type="button" width="96" />
                    </div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>

    <v-row v-else dense>
        <v-col v-for="group in verifiedPrescriptions" :key="group.medicalRecordId" cols="12" lg="6">
            <v-card elevation="0" class="h-100 pharmacy-group-card">
                <v-card-text class="d-flex flex-column ga-4">
                    <div class="d-flex flex-wrap align-start justify-space-between ga-4">
                        <div>
                            <div class="text-h6">{{ group.patientName }}</div>
                            <div class="text-body-2 text-medium-emphasis">{{ group.mrn }} • {{ group.doctorName }}</div>
                            <div class="text-caption text-medium-emphasis mt-1">
                                {{ group.items.length }} medicine(s) in this prescription
                            </div>
                        </div>
                        <div class="d-flex flex-wrap align-center justify-end ga-2">
                            <v-chip size="small" variant="tonal" :color="statusColor(group.status)">
                                {{ group.status }}
                            </v-chip>
                            <v-chip size="small" variant="tonal" color="secondary">
                                {{ group.priority }} priority
                            </v-chip>
                        </div>
                    </div>

                    <div class="text-caption text-medium-emphasis">
                        Requested {{ formatDateTime(group.requestedAt) }}
                    </div>

                    <v-table density="comfortable" class="pharmacy-group-table">
                        <thead class="bg-containerBg">
                            <tr>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Medication</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Dosage</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Frequency</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Duration</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in group.items" :key="item.id">
                                <td class="py-3">
                                    <div class="text-body-2 font-weight-medium">{{ medicineLabel([item]) }}</div>
                                    <div class="text-caption text-medium-emphasis">{{ item.instructions || '-' }}</div>
                                </td>
                                <td class="py-3 text-body-2">{{ item.dosage || '-' }}</td>
                                <td class="py-3 text-body-2">{{ item.frequency || '-' }}</td>
                                <td class="py-3 text-body-2">{{ item.duration || '-' }}</td>
                            </tr>
                        </tbody>
                    </v-table>

                    <div class="d-flex flex-wrap justify-end ga-2">
                        <v-btn size="small" color="primary" variant="flat" @click="markAsDispensed(group.medicalRecordId)">
                            Mark as Dispensed
                        </v-btn>
                        <v-btn size="small" color="secondary" variant="tonal" @click="openNote(group.medicalRecordId)">
                            Add Pharmacist Note
                        </v-btn>
                        <v-btn size="small" color="error" variant="text" @click="returnToDoctor(group.medicalRecordId)">
                            Return to Doctor
                        </v-btn>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>

    <v-card v-if="verifiedPrescriptions.length === 0 && !isLoading" elevation="0">
        <v-card-text class="py-10 text-center text-medium-emphasis">
            No verified prescriptions found.
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

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" timeout="3000">
        {{ snackbarMsg }}
        <template #actions>
            <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
        </template>
    </v-snackbar>
</template>

<style scoped>
.pharmacy-group-card,
.pharmacy-skeleton-card {
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: none;
}

.pharmacy-group-table {
    border-radius: 12px;
    overflow: hidden;
}
</style>
