<script setup lang="ts">
import usePharmacyWorkspace from '~/composables/usePharmacyWorkspace'

const workspace = usePharmacyWorkspace()
const detailDialog = ref(false)
const labelDialog = ref(false)
const selectedId = ref<string | null>(null)

const readyPrescriptions = computed(() => workspace.prescriptions.value.filter((item) => item.status === 'Verified'))

const selectedPrescription = computed(() =>
    readyPrescriptions.value.find((item) => item.id === selectedId.value) ?? null,
)

function openDetail(id: string) {
    selectedId.value = id
    detailDialog.value = true
}

function printLabel(id: string) {
    selectedId.value = id
    labelDialog.value = true
}

function markAsDispensed(id: string) {
    workspace.updatePrescriptionStatus(id, 'Dispensed', 'Dispensed by pharmacy.')
}

function formatDateTime(value: string) {
    return new Date(value).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex flex-wrap align-center justify-space-between ga-3">
            <div>
                <div class="text-caption text-uppercase text-medium-emphasis">Pharmacy Operations</div>
                <v-card-title class="text-h4">Medicine Dispensing</v-card-title>
                <v-card-subtitle class="mt-1">
                    Manage verified prescriptions that are ready to be handed to the patient.
                </v-card-subtitle>
            </div>
        </div>
    </v-card-item>

    <v-row>
        <v-col v-for="item in readyPrescriptions" :key="item.id" cols="12" lg="6">
            <v-card elevation="0" class="h-100 pharmacy-card">
                <v-card-text class="d-flex flex-column ga-3">
                    <div class="d-flex align-start justify-space-between ga-3">
                        <div>
                            <div class="text-h6">{{ item.patientName }}</div>
                            <div class="text-body-2 text-medium-emphasis">{{ item.mrn }}</div>
                        </div>
                        <v-chip size="small" variant="tonal" color="success">
                            Ready
                        </v-chip>
                    </div>

                    <div class="text-body-2">
                        <strong>Medicines:</strong> {{ item.medicines.join(', ') }}
                    </div>
                    <div class="text-body-2">
                        <strong>Verified Time:</strong> {{ item.verifiedAt ? formatDateTime(item.verifiedAt) : '-' }}
                    </div>
                    <div class="text-body-2 text-medium-emphasis">
                        {{ item.pharmacistNote || 'No pharmacist note yet.' }}
                    </div>

                    <div class="d-flex flex-wrap ga-2 justify-end">
                        <v-btn size="small" color="primary" variant="flat" @click="markAsDispensed(item.id)">
                            Mark as Dispensed
                        </v-btn>
                        <v-btn size="small" color="secondary" variant="tonal" @click="printLabel(item.id)">
                            Print Label
                        </v-btn>
                        <v-btn size="small" color="info" variant="text" @click="openDetail(item.id)">
                            View Detail
                        </v-btn>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>

    <v-card v-if="readyPrescriptions.length === 0" elevation="0">
        <v-card-text class="py-10 text-center text-medium-emphasis">
            No verified prescriptions are ready for dispensing.
        </v-card-text>
    </v-card>

    <v-dialog v-model="detailDialog" max-width="620">
        <v-card v-if="selectedPrescription">
            <v-card-title class="text-h6">Prescription Detail</v-card-title>
            <v-card-text class="d-flex flex-column ga-2">
                <div><strong>Patient:</strong> {{ selectedPrescription.patientName }}</div>
                <div><strong>MRN:</strong> {{ selectedPrescription.mrn }}</div>
                <div><strong>Medicines:</strong> {{ selectedPrescription.medicines.join(', ') }}</div>
                <div><strong>Note:</strong> {{ selectedPrescription.note }}</div>
                <div><strong>Verified Time:</strong> {{ selectedPrescription.verifiedAt ? formatDateTime(selectedPrescription.verifiedAt) : '-' }}</div>
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
</template>

<style scoped>
.pharmacy-card {
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: none;
}
</style>
