<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePharmacyPrescriptions } from '~/composables/usePharmacyPrescriptions'
import type { PrescriptionItem } from '~/types/pharmacy'

const { can } = usePermission()
const feed = usePharmacyPrescriptions()
const detailDialog = ref(false)
const labelDialog = ref(false)
const selectedGroupId = ref<string | null>(null)
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref<'success' | 'error' | 'info'>('success')

const readyPrescriptions = computed(() => feed.groupedPrescriptions.value.filter((item) => item.status === 'Verified'))
const selectedGroup = computed(() => readyPrescriptions.value.find((item) => item.medicalRecordId === selectedGroupId.value) ?? null)
const isLoading = computed(() => feed.pending.value && readyPrescriptions.value.length === 0)

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

function openDetail(groupId: string) {
    selectedGroupId.value = groupId
    detailDialog.value = true
}

function printLabel(groupId: string) {
    selectedGroupId.value = groupId
    labelDialog.value = true
}

async function updateGroupStatus(groupId: string, payload: { status: 'Verified' | 'Dispensed'; pharmacistNote?: string | null }) {
    const group = readyPrescriptions.value.find((item) => item.medicalRecordId === groupId)
    if (!group) return

    await Promise.all(group.items.map((item) => feed.setPrescriptionStatus(item.id, payload)))
}

async function markAsDispensed(groupId: string) {
    try {
        await updateGroupStatus(groupId, {
            status: 'Dispensed',
            pharmacistNote: 'Dispensed by pharmacy.',
        })
        notify('Prescription group marked as dispensed', 'success')
    } catch (error: any) {
        notify(error?.data?.message ?? error?.message ?? 'Failed to mark as dispensed', 'error')
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
                <v-card-title class="text-h4">Medicine Dispensing</v-card-title>
                <v-card-subtitle class="mt-1">
                    Manage verified prescriptions by patient visit, ready to be handed to the patient.
                </v-card-subtitle>
            </div>
        </div>
    </v-card-item>

    <v-alert v-if="feed.error.value" type="error" variant="tonal" density="comfortable" class="mb-4">
        {{ feed.error.value?.message || 'Unable to load prescriptions.' }}
    </v-alert>

    <v-row v-if="isLoading">
        <v-col v-for="index in 4" :key="index" cols="12" lg="6">
            <v-card  elevation="0" variant="outlined" :style="{ borderColor: '#e0e0e0' }" class="pharmacy-skeleton-card h-100">
                <v-card-text class="d-flex flex-column ga-4">
                    <div class="d-flex align-start justify-space-between ga-3">
                        <div class="flex-grow-1">
                            <v-skeleton-loader type="heading" width="42%" class="mb-2" />
                            <v-skeleton-loader type="text" width="22%" />
                        </div>
                        <v-skeleton-loader type="chip" width="78" />
                    </div>

                    <div>
                        <v-skeleton-loader type="text" width="28%" class="mb-2" />
                        <v-skeleton-loader type="text" width="72%" />
                    </div>

                    <div>
                        <v-skeleton-loader type="text" width="34%" class="mb-2" />
                        <v-skeleton-loader type="text" width="46%" />
                    </div>

                    <div>
                        <v-skeleton-loader type="text" width="24%" class="mb-2" />
                        <v-skeleton-loader type="text" width="58%" />
                    </div>

                    <div class="d-flex flex-wrap justify-end ga-2">
                        <v-skeleton-loader v-for="actionIndex in 3" :key="actionIndex" type="button" width="104" />
                    </div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>

    <v-row v-else dense>
        <v-col v-for="group in readyPrescriptions" :key="group.medicalRecordId" cols="12" lg="6">
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
                        Verified {{ formatDateTime(group.verifiedAt) }}
                    </div>

                    <v-table density="comfortable" class="pharmacy-group-table">
                        <thead class="bg-containerBg">
                            <tr>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Medication</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Dosage</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Frequency</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Duration</th>
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

                    <div class="text-body-2 text-medium-emphasis">
                        {{ group.pharmacistNote || 'No pharmacist note yet.' }}
                    </div>

                    <div class="d-flex flex-wrap justify-end ga-2">
                        <v-btn v-if="can('prescriptions.dispense')" size="small" color="primary" variant="flat"
                            @click="markAsDispensed(group.medicalRecordId)">
                            Mark as Dispensed
                        </v-btn>
                        <v-btn size="small" color="secondary" variant="tonal"
                            @click="printLabel(group.medicalRecordId)">
                            Print Label
                        </v-btn>
                        <v-btn size="small" color="info" variant="text" @click="openDetail(group.medicalRecordId)">
                            View Detail
                        </v-btn>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>

    <v-card v-if="readyPrescriptions.length === 0 && !isLoading" elevation="0">
        <v-card-text class="py-10 text-center text-medium-emphasis">
            No verified prescriptions are ready for dispensing.
        </v-card-text>
    </v-card>

    <v-dialog v-model="detailDialog" max-width="620">
        <v-card v-if="selectedGroup">
            <v-card-title class="text-h6">Prescription Group Detail</v-card-title>
            <v-card-text class="d-flex flex-column ga-2">
                <div><strong>Patient:</strong> {{ selectedGroup.patientName }}</div>
                <div><strong>MRN:</strong> {{ selectedGroup.mrn }}</div>
                <div><strong>Doctor:</strong> {{ selectedGroup.doctorName }}</div>
                <div><strong>Status:</strong> {{ selectedGroup.status }}</div>
                <div><strong>Verified Time:</strong> {{ formatDateTime(selectedGroup.verifiedAt) }}</div>
                <div><strong>Medicines:</strong> {{selectedGroup.items.map((item) => item.medicines.join(', ')).join('• ') }}</div>
            </v-card-text>
            <v-card-actions class="justify-end">
                <v-btn variant="text" @click="detailDialog = false">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="labelDialog" max-width="560">
        <v-card>
            <v-card-title class="text-h6">Print Label</v-card-title>
            <v-card-text>
                <v-alert type="info" variant="tonal">
                    Dummy print preview only. This button is ready for the future label printing flow.
                </v-alert>
            </v-card-text>
            <v-card-actions class="justify-end">
                <v-btn variant="text" @click="labelDialog = false">Close</v-btn>
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
