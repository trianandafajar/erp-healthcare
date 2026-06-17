<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePharmacyPrescriptions } from '~/composables/usePharmacyPrescriptions'
import type { PrescriptionItem } from '~/types/pharmacy'

const feed = usePharmacyPrescriptions()

const search = ref('')
const detailDialog = ref(false)
const rejectDialog = ref(false)
const selectedGroupId = ref<string | null>(null)
const rejectNote = ref('')
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref<'success' | 'error' | 'info'>('success')

const groupedPrescriptions = computed(() => feed.groupedPrescriptions.value.filter((group) => group.status === 'Pending'))
const isLoading = computed(() => feed.pending.value && groupedPrescriptions.value.length === 0)

const filteredPrescriptions = computed(() => {
    const keyword = search.value.trim().toLowerCase()

    return groupedPrescriptions.value.filter((group) => {
        if (!keyword) return true

        return (
            group.patientName.toLowerCase().includes(keyword) ||
            group.mrn.toLowerCase().includes(keyword) ||
            group.doctorName.toLowerCase().includes(keyword) ||
            group.items.some((item) =>
                item.medicines.join(', ').toLowerCase().includes(keyword) ||
                (item.dosage ?? '').toLowerCase().includes(keyword) ||
                (item.frequency ?? '').toLowerCase().includes(keyword) ||
                (item.duration ?? '').toLowerCase().includes(keyword) ||
                (item.instructions ?? '').toLowerCase().includes(keyword),
            )
        )
    })
})

const selectedGroup = computed(() =>
    groupedPrescriptions.value.find((group) => group.medicalRecordId === selectedGroupId.value) ?? null,
)

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

function openReject(groupId: string) {
    selectedGroupId.value = groupId
    rejectNote.value = ''
    rejectDialog.value = true
}

async function updateGroupStatus(groupId: string, payload: { status: 'Verified' | 'Rejected'; pharmacistNote?: string | null; rejectionNote?: string | null }) {
    const group = groupedPrescriptions.value.find((item) => item.medicalRecordId === groupId)
    if (!group) return

    await Promise.all(
        group.items.map((item) =>
            feed.setPrescriptionStatus(item.id, payload),
        ),
    )
}

async function verifyGroup(groupId: string) {
    try {
        await updateGroupStatus(groupId, {
            status: 'Verified',
            pharmacistNote: 'Verified by pharmacist.',
        })
        notify('Prescription group verified successfully', 'success')
    } catch (error: any) {
        notify(error?.data?.message ?? error?.message ?? 'Failed to verify prescription group', 'error')
    }
}

async function rejectGroup() {
    if (!selectedGroupId.value) return

    try {
        await updateGroupStatus(selectedGroupId.value, {
            status: 'Rejected',
            pharmacistNote: rejectNote.value.trim() || 'Returned to doctor.',
            rejectionNote: rejectNote.value.trim() || 'Returned to doctor.',
        })

        rejectDialog.value = false
        notify('Prescription group returned to doctor', 'info')
    } catch (error: any) {
        notify(error?.data?.message ?? error?.message ?? 'Failed to reject prescription group', 'error')
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
                <v-card-title class="text-h4">Incoming Prescriptions</v-card-title>
                <v-card-subtitle class="mt-1">
                    Track prescriptions by patient visit, not per medicine row.
                </v-card-subtitle>
            </div>
        </div>
    </v-card-item>

    <v-card elevation="0">
        <v-card-text class="d-flex flex-column ga-4">
            <v-alert v-if="feed.error.value" type="error" variant="tonal" density="comfortable" class="mb-1">
                {{ feed.error.value?.message || 'Unable to load prescriptions.' }}
            </v-alert>

            <v-row dense>
                <v-col cols="12" md="7">
                    <v-text-field
                        v-model="search"
                        label="Search patient, MRN, doctor, or medicine"
                        placeholder="Search patient, MRN, doctor, or medicine"
                        prepend-inner-icon="mdi-magnify"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                        clearable
                    />
                </v-col>
                <v-col cols="12" md="5" />
            </v-row>

            <v-progress-linear v-if="feed.pending.value && groupedPrescriptions.length > 0" indeterminate color="primary" rounded />

            <v-row v-if="isLoading" dense>
                <v-col v-for="index in 4" :key="index" cols="12">
                    <v-card elevation="0" class="pharmacy-skeleton-card">
                        <v-card-text class="d-flex flex-column ga-4">
                            <div class="d-flex align-start justify-space-between ga-4">
                                <div class="flex-grow-1">
                                    <v-skeleton-loader type="heading" width="40%" class="mb-2" />
                                    <v-skeleton-loader type="text" width="22%" />
                                </div>
                                <v-skeleton-loader type="chip" width="88" />
                            </div>

                            <div>
                                <v-skeleton-loader type="text" width="28%" class="mb-2" />
                                <v-skeleton-loader type="text" width="78%" />
                                <v-skeleton-loader type="text" width="46%" class="mt-2" />
                            </div>

                            <div class="d-flex flex-column ga-2">
                                <v-skeleton-loader type="text" width="18%" />
                                <v-skeleton-loader type="text" width="68%" />
                                <v-skeleton-loader type="text" width="54%" />
                            </div>

                            <div class="d-flex flex-wrap justify-end ga-2">
                                <v-skeleton-loader v-for="actionIndex in 3" :key="actionIndex" type="button" width="96" />
                            </div>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>

            <v-row v-else dense>
                <v-col v-for="group in filteredPrescriptions" :key="group.medicalRecordId" cols="12">
                    <v-card elevation="0" class="pharmacy-group-card">
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
                                        <th class="text-left text-caption font-weight-bold text-uppercase">Instructions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="item in group.items" :key="item.id">
                                        <td class="py-3">
                                            <div class="text-body-2 font-weight-medium">{{ medicineLabel([item]) }}</div>
                                        </td>
                                        <td class="py-3 text-body-2">{{ item.dosage || '-' }}</td>
                                        <td class="py-3 text-body-2">{{ item.frequency || '-' }}</td>
                                        <td class="py-3 text-body-2">{{ item.duration || '-' }}</td>
                                        <td class="py-3 text-body-2">{{ item.instructions || '-' }}</td>
                                    </tr>
                                </tbody>
                            </v-table>

                            <div class="d-flex flex-wrap justify-end ga-2">
                                <v-btn size="small" variant="text" color="secondary" @click="openDetail(group.medicalRecordId)">
                                    View Detail
                                </v-btn>
                                <v-btn size="small" variant="text" color="success" @click="verifyGroup(group.medicalRecordId)">
                                    Verify Group
                                </v-btn>
                                <v-btn size="small" variant="text" color="error" @click="openReject(group.medicalRecordId)">
                                    Reject Group
                                </v-btn>
                            </div>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>

            <v-card v-if="filteredPrescriptions.length === 0 && !isLoading" elevation="0">
                <v-card-text class="py-10 text-center text-medium-emphasis">
                    No prescriptions found
                </v-card-text>
            </v-card>
        </v-card-text>
    </v-card>

    <v-dialog v-model="detailDialog" max-width="920">
        <v-card v-if="selectedGroup" class="pharmacy-detail-shell">
            <v-card-title class="text-h6 d-flex flex-wrap align-center justify-space-between ga-3">
                <span>Prescription Group Detail</span>
                <v-chip size="small" variant="tonal" :color="statusColor(selectedGroup.status)">
                    {{ selectedGroup.status }}
                </v-chip>
            </v-card-title>

            <v-card-text>
                <v-row dense>
                    <v-col cols="12" md="5">
                        <v-card variant="tonal" color="primary" class="h-100">
                            <v-card-text class="d-flex flex-column ga-4">
                                <div>
                                    <div class="text-caption text-uppercase text-medium-emphasis">Patient</div>
                                    <div class="text-h6">{{ selectedGroup.patientName }}</div>
                                    <div class="text-body-2 text-medium-emphasis">{{ selectedGroup.mrn }}</div>
                                </div>

                                <div class="pharmacy-detail-grid">
                                    <div>
                                        <div class="text-caption text-medium-emphasis">Doctor</div>
                                        <div class="text-body-2 font-weight-medium">{{ selectedGroup.doctorName }}</div>
                                    </div>
                                    <div>
                                        <div class="text-caption text-medium-emphasis">Priority</div>
                                        <div class="text-body-2 font-weight-medium">{{ selectedGroup.priority }}</div>
                                    </div>
                                    <div>
                                        <div class="text-caption text-medium-emphasis">Requested</div>
                                        <div class="text-body-2 font-weight-medium">{{ formatDateTime(selectedGroup.requestedAt) }}</div>
                                    </div>
                                    <div>
                                        <div class="text-caption text-medium-emphasis">Last Update</div>
                                        <div class="text-body-2 font-weight-medium">{{ formatDateTime(selectedGroup.lastUpdatedAt) }}</div>
                                    </div>
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-col>

                    <v-col cols="12" md="7">
                        <v-card variant="outlined" class="h-100 pharmacy-detail-card">
                            <v-card-text class="d-flex flex-column ga-4">
                                <div>
                                    <div class="text-caption text-uppercase text-medium-emphasis">Medicines</div>
                                    <div class="text-h6">{{ selectedGroup.items.length }} item(s)</div>
                                </div>

                                <v-table density="comfortable">
                                    <thead class="bg-containerBg">
                                        <tr>
                                            <th class="text-left text-caption font-weight-bold text-uppercase">Medication</th>
                                            <th class="text-left text-caption font-weight-bold text-uppercase">Dosage</th>
                                            <th class="text-left text-caption font-weight-bold text-uppercase">Frequency</th>
                                            <th class="text-left text-caption font-weight-bold text-uppercase">Duration</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="item in selectedGroup.items" :key="item.id">
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
            <v-card-title class="text-h6">Reject Prescription Group</v-card-title>
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
                <v-btn color="error" variant="flat" @click="rejectGroup">Reject</v-btn>
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
.pharmacy-detail-card,
.pharmacy-skeleton-card {
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: none;
}

.pharmacy-group-table {
    border-radius: 12px;
    overflow: hidden;
}

.pharmacy-detail-shell {
    overflow: hidden;
}

.pharmacy-detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 16px;
}

@media (max-width: 960px) {
    .pharmacy-detail-grid {
        grid-template-columns: 1fr;
    }
}
</style>
