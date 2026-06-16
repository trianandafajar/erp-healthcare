<script setup lang="ts">
import usePharmacyWorkspace from '~/composables/usePharmacyWorkspace'

const workspace = usePharmacyWorkspace()
const search = ref('')
const statusFilter = ref<'all' | 'Pending' | 'Verified' | 'Rejected' | 'Dispensed'>('all')
const detailDialog = ref(false)
const rejectDialog = ref(false)
const selectedId = ref<string | null>(null)
const rejectNote = ref('')

const statusOptions = [
    { title: 'All statuses', value: 'all' },
    { title: 'Pending', value: 'Pending' },
    { title: 'Verified', value: 'Verified' },
    { title: 'Rejected', value: 'Rejected' },
    { title: 'Dispensed', value: 'Dispensed' },
]

const prescriptions = computed(() => workspace.prescriptions.value)

const filteredPrescriptions = computed(() => {
    const keyword = search.value.trim().toLowerCase()

    return prescriptions.value.filter((item) => {
        const matchStatus = statusFilter.value === 'all' || item.status === statusFilter.value
        const matchKeyword = !keyword ||
            item.patientName.toLowerCase().includes(keyword) ||
            item.mrn.toLowerCase().includes(keyword) ||
            item.doctorName.toLowerCase().includes(keyword)

        return matchStatus && matchKeyword
    })
})

const selectedPrescription = computed(() =>
    prescriptions.value.find((item) => item.id === selectedId.value) ?? null,
)

function openDetail(id: string) {
    selectedId.value = id
    detailDialog.value = true
}

function openReject(id: string) {
    selectedId.value = id
    rejectNote.value = ''
    rejectDialog.value = true
}

function verifyPrescription(id: string) {
    workspace.updatePrescriptionStatus(id, 'Verified', 'Verified by pharmacist.')
}

function rejectPrescription() {
    if (!selectedId.value) return
    workspace.updatePrescriptionStatus(selectedId.value, 'Rejected', rejectNote.value.trim() || 'Returned to doctor.')
    rejectDialog.value = false
}

function dispensePrescription(id: string) {
    workspace.updatePrescriptionStatus(id, 'Dispensed', 'Dispensed from prescription list.')
}

function formatDateTime(value: string) {
    return new Date(value).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })
}

function medicineSummary(items: string[]) {
    return items.join(', ')
}

function statusColor(status: string) {
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
                <v-card-title class="text-h4">Incoming Prescriptions</v-card-title>
                <v-card-subtitle class="mt-1">
                    Review prescriptions that have arrived from doctors and triage them for verification.
                </v-card-subtitle>
            </div>
        </div>
    </v-card-item>

    <v-card elevation="0">
        <v-card-text class="d-flex flex-column ga-4">
            <v-row dense>
                <v-col cols="12" md="7">
                    <v-text-field
                        v-model="search"
                        label="Search patient, MRN, or doctor"
                        placeholder="Search patient, MRN, or doctor"
                        prepend-inner-icon="mdi-magnify"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                        clearable
                    />
                </v-col>
                <v-col cols="12" md="5">
                    <v-select
                        v-model="statusFilter"
                        :items="statusOptions"
                        item-title="title"
                        item-value="value"
                        label="Filter by status"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                    />
                </v-col>
            </v-row>

            <v-table hover density="comfortable">
                <thead class="bg-containerBg">
                    <tr>
                        <th class="text-left text-caption font-weight-bold text-uppercase">Patient</th>
                        <th class="text-left text-caption font-weight-bold text-uppercase">Doctor</th>
                        <th class="text-left text-caption font-weight-bold text-uppercase">Medicines</th>
                        <th class="text-left text-caption font-weight-bold text-uppercase">Status</th>
                        <th class="text-left text-caption font-weight-bold text-uppercase">Requested</th>
                        <th class="text-right text-caption font-weight-bold text-uppercase pharmacy-actions-head">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="filteredPrescriptions.length === 0">
                        <td colspan="6" class="text-center py-8 text-medium-emphasis">
                            No prescriptions found
                        </td>
                    </tr>
                    <tr v-else v-for="item in filteredPrescriptions" :key="item.id">
                        <td class="py-3">
                            <div class="text-body-2 font-weight-medium">{{ item.patientName }}</div>
                            <div class="text-caption text-medium-emphasis">{{ item.mrn }}</div>
                        </td>
                        <td class="py-3 text-body-2">{{ item.doctorName }}</td>
                        <td class="py-3">
                            <div class="text-body-2">{{ medicineSummary(item.medicines) }}</div>
                            <div class="text-caption text-medium-emphasis">{{ item.note }}</div>
                        </td>
                        <td class="py-3">
                            <v-chip size="small" variant="tonal" :color="statusColor(item.status)">
                                {{ item.status }}
                            </v-chip>
                        </td>
                        <td class="py-3 text-body-2 text-medium-emphasis">
                            {{ formatDateTime(item.requestedAt) }}
                        </td>
                        <td class="py-3 text-right pharmacy-actions-cell">
                            <div class="pharmacy-action-group">
                                <v-btn size="small" variant="text" color="secondary" @click="openDetail(item.id)">
                                    View Detail
                                </v-btn>
                                <v-btn size="small" variant="text" color="success" @click="verifyPrescription(item.id)">
                                    Verify
                                </v-btn>
                                <v-btn size="small" variant="text" color="error" @click="openReject(item.id)">
                                    Reject
                                </v-btn>
                                <v-btn
                                    v-if="item.status === 'Verified'"
                                    size="small"
                                    variant="text"
                                    color="primary"
                                    @click="dispensePrescription(item.id)"
                                >
                                    Dispense
                                </v-btn>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </v-table>
        </v-card-text>
    </v-card>

    <v-dialog v-model="detailDialog" max-width="820">
        <v-card v-if="selectedPrescription">
            <v-card-title class="text-h6 d-flex align-center justify-space-between">
                <span>Prescription Detail</span>
                <v-chip size="small" variant="tonal" :color="statusColor(selectedPrescription.status)">
                    {{ selectedPrescription.status }}
                </v-chip>
            </v-card-title>
            <v-card-text>
                <v-row dense>
                    <v-col cols="12" md="7">
                        <div class="pharmacy-detail-box">
                            <div class="pharmacy-detail-grid">
                                <div>
                                    <div class="text-caption text-medium-emphasis">Patient</div>
                                    <div class="text-body-1 font-weight-medium">{{ selectedPrescription.patientName }}</div>
                                </div>
                                <div>
                                    <div class="text-caption text-medium-emphasis">MRN</div>
                                    <div class="text-body-1 font-weight-medium">{{ selectedPrescription.mrn }}</div>
                                </div>
                                <div>
                                    <div class="text-caption text-medium-emphasis">Doctor</div>
                                    <div class="text-body-1 font-weight-medium">{{ selectedPrescription.doctorName }}</div>
                                </div>
                                <div>
                                    <div class="text-caption text-medium-emphasis">Priority</div>
                                    <div class="text-body-1 font-weight-medium">{{ selectedPrescription.priority }}</div>
                                </div>
                                <div>
                                    <div class="text-caption text-medium-emphasis">Requested At</div>
                                    <div class="text-body-2">{{ formatDateTime(selectedPrescription.requestedAt) }}</div>
                                </div>
                                <div>
                                    <div class="text-caption text-medium-emphasis">Last Pharmacist Note</div>
                                    <div class="text-body-2">{{ selectedPrescription.pharmacistNote || '-' }}</div>
                                </div>
                            </div>
                        </div>
                    </v-col>
                    <v-col cols="12" md="5">
                        <v-card variant="tonal" color="primary" class="h-100">
                            <v-card-text>
                                <div class="text-caption text-uppercase text-medium-emphasis">Medicines</div>
                                <div class="d-flex flex-column ga-2 mt-2">
                                    <v-chip v-for="medicine in selectedPrescription.medicines" :key="medicine" size="small" variant="flat" color="white" class="justify-start">
                                        {{ medicine }}
                                    </v-chip>
                                </div>
                                <div class="mt-4">
                                    <div class="text-caption text-uppercase text-medium-emphasis">Doctor Note</div>
                                    <div class="text-body-2 mt-1">{{ selectedPrescription.note }}</div>
                                </div>
                                <div class="mt-4" v-if="selectedPrescription.rejectionNote">
                                    <div class="text-caption text-uppercase text-medium-emphasis">Rejection Note</div>
                                    <div class="text-body-2 mt-1">{{ selectedPrescription.rejectionNote }}</div>
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-card-actions class="justify-end">
                <v-btn variant="text" @click="detailDialog = false">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="rejectDialog" max-width="560">
        <v-card>
            <v-card-title class="text-h6">Reject Prescription</v-card-title>
            <v-card-text>
                <v-textarea
                    v-model="rejectNote"
                    label="Reason"
                    rows="4"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Write the rejection reason for the doctor"
                />
            </v-card-text>
            <v-card-actions class="justify-end">
                <v-btn variant="text" @click="rejectDialog = false">Cancel</v-btn>
                <v-btn color="error" variant="flat" @click="rejectPrescription">Reject</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style scoped>
.pharmacy-actions-head {
    width: 340px;
}

.pharmacy-actions-cell {
    min-width: 340px;
}

.pharmacy-action-group {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
    flex-wrap: nowrap;
    white-space: nowrap;
}

.pharmacy-detail-box {
    height: 100%;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 14px;
    padding: 16px;
}

.pharmacy-detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 16px;
}

@media (max-width: 960px) {
    .pharmacy-actions-head,
    .pharmacy-actions-cell {
        width: auto;
        min-width: 0;
    }

    .pharmacy-action-group {
        flex-wrap: wrap;
    }

    .pharmacy-detail-grid {
        grid-template-columns: 1fr;
    }
}
</style>
