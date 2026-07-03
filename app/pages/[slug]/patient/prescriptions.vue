<script setup lang="ts">
definePageMeta({
    layout: 'patient',
    middleware: ['auth', 'permission'],
    permissions: ['prescriptions.view'],
})

useSeoMeta({
    title: 'Prescription History',
    description: 'Patient prescription history page',
})

type MedicationItem = {
    medication: string
    dosage: string | null
    frequency: string | null
    duration: string | null
    instructions: string[]
}

type PrescriptionItem = {
    id: string
    prescribedAt: string
    doctor: string
    department: string
    visitReference: string
    status: 'Active' | 'Completed' | 'Expired' | string
    medications: MedicationItem[]
}

const { data } = await useFetch<{ prescriptions: PrescriptionItem[] }>('/api/patient/prescriptions')

const prescriptions = computed(() => data.value?.prescriptions ?? [])

const statusFilter = ref('all')
const search = ref('')
const detailDialog = ref(false)
const selectedPrescription = ref<PrescriptionItem | null>(null)

const filteredPrescriptions = computed(() =>
    prescriptions.value.filter((item) => {
        const keyword = search.value.toLowerCase()
        const matchSearch =
            item.id.toLowerCase().includes(keyword) ||
            item.doctor.toLowerCase().includes(keyword) ||
            item.department.toLowerCase().includes(keyword) ||
            item.visitReference.toLowerCase().includes(keyword) ||
            item.medications.some((m) =>
                (m.medication ?? '').toLowerCase().includes(keyword)
            )
        return matchSearch
    })
)

function openDetail(item: PrescriptionItem) {
    selectedPrescription.value = item
    detailDialog.value = true
}

function statusColor(status: string) {
    return ({
        Active: 'success',
        Completed: 'primary',
        Expired: 'error'
    } as Record<string, string>)[status] ?? 'secondary'
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
}

function shortId(id?: string | null) {
    if (!id) return ''
    return id.split('-')[0].toUpperCase()
}
</script>

<template>
    <div class="d-flex justify-space-between align-center mb-6 flex-wrap ga-3">
        <div>
            <h2 class="text-h3 mb-1">Prescription History</h2>
            <p class="text-medium-emphasis mb-0">Review medication records in table form and open full administration
                details.</p>
        </div>
    </div>

    <UiTitleCard class-name="px-0 pb-0 rounded-md" title="Prescription Records">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 px-4 py-3">
            <v-text-field v-model="search" placeholder="Search prescription, doctor, medication, or department"
                prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable
                style="max-width: 420px" />
            <v-btn-toggle v-model="statusFilter" mandatory density="compact" variant="tonal" color="primary"
                class="flex-wrap">
                <v-btn value="all">All</v-btn>
                <v-btn value="Active">Active</v-btn>
                <v-btn value="Completed">Completed</v-btn>
                <v-btn value="Expired">Expired</v-btn>
            </v-btn-toggle>
        </div>

        <v-table class="text-no-wrap">
            <thead>
                <tr>
                    <th>Prescribed At</th>
                    <th>Prescription ID</th>
                    <th>Doctor</th>
                    <th>Department</th>
                    <th>Visit Ref</th>
                    <th>Items</th>
                    <th>Status</th>
                    <th class="text-right">Action</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in filteredPrescriptions" :key="item.id">
                    <td>{{ formatDate(item.prescribedAt) }}</td>
                    <td>
                        <span class="text-caption font-weight-medium">{{ shortId(item.id) }}</span>
                    </td>
                    <td>{{ item.doctor }}</td>
                    <td>{{ item.department }}</td>
                    <td>
                        <span class="text-caption text-medium-emphasis">{{ shortId(item.visitReference) }}</span>
                    </td>
                    <td>
                        <v-chip size="small" color="primary" variant="tonal">
                            {{ item.medications.length }} medication{{ item.medications.length > 1 ? 's' : '' }}
                        </v-chip>
                    </td>
                    <td>
                        <v-chip size="small" :color="statusColor(item.status)" variant="tonal">
                            {{ item.status }}
                        </v-chip>
                    </td>
                    <td class="text-right">
                        <v-btn size="small" variant="text" color="primary" prepend-icon="mdi-eye-outline"
                            @click="openDetail(item)">
                            View Detail
                        </v-btn>
                    </td>
                </tr>
                <tr v-if="filteredPrescriptions.length === 0">
                    <td colspan="8" class="text-center py-6 text-medium-emphasis">No prescription record found.</td>
                </tr>
            </tbody>
        </v-table>
    </UiTitleCard>

    <v-dialog v-model="detailDialog" max-width="880">
        <v-card v-if="selectedPrescription" rounded="lg">
            <v-card-item>
                <div class="d-flex justify-space-between align-start flex-wrap ga-3">
                    <div>
                        <v-card-title class="px-0">Prescription #{{ shortId(selectedPrescription.id) }}</v-card-title>
                        <v-card-subtitle class="px-0 mt-1">
                            {{ selectedPrescription.doctor }} | {{ selectedPrescription.department }}
                        </v-card-subtitle>
                    </div>
                    <div class="d-flex flex-wrap ga-2">
                        <v-chip color="primary" variant="tonal">{{ formatDate(selectedPrescription.prescribedAt)
                            }}</v-chip>
                        <v-chip :color="statusColor(selectedPrescription.status)" variant="tonal">
                            {{ selectedPrescription.status }}
                        </v-chip>
                    </div>
                </div>
            </v-card-item>

            <v-card-text>
                <v-row class="mb-2">
                    <v-col cols="12" md="6">
                        <div class="text-caption text-medium-emphasis">Medication Items</div>
                        <div class="text-body-1 font-weight-medium">{{ selectedPrescription.medications.length }}</div>
                    </v-col>
                    <v-col cols="12" md="6">
                        <div class="text-caption text-medium-emphasis">Prescription Date</div>
                        <div class="text-body-1 font-weight-medium">{{ formatDate(selectedPrescription.prescribedAt)
                        }}</div>
                    </v-col>
                </v-row>

                <div class="text-caption text-medium-emphasis mb-2 mt-2">Medication Details</div>
                <v-table density="compact">
                    <thead>
                        <tr>
                            <th>Medication</th>
                            <th>Dosage</th>
                            <th>Frequency</th>
                            <th>Duration</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="medication in selectedPrescription.medications" :key="medication.medication">
                            <td class="text-wrap">{{ medication.medication }}</td>
                            <td>{{ medication.dosage ?? '-' }}</td>
                            <td>{{ medication.frequency ?? '-' }}</td>
                            <td>{{ medication.duration ?? '-' }}</td>
                        </tr>
                    </tbody>
                </v-table>

                <v-row class="mt-4">
                    <v-col v-for="medication in selectedPrescription.medications" :key="medication.medication"
                        cols="12">
                        <v-card elevation="0" border rounded="lg">
                            <v-card-text>
                                <div class="text-body-1 font-weight-medium mb-3">{{ medication.medication }}</div>
                                <div class="text-caption text-medium-emphasis mb-2">How to Take</div>
                                <template v-if="medication.instructions.length">
                                    <v-list density="compact" class="py-0 bg-transparent">
                                        <v-list-item v-for="instruction in medication.instructions" :key="instruction"
                                            class="px-0">
                                            <template #prepend>
                                                <v-icon icon="mdi-pill" size="18" color="primary" class="mr-2" />
                                            </template>
                                            <v-list-item-title class="text-body-2 text-wrap">{{ instruction
                                            }}</v-list-item-title>
                                        </v-list-item>
                                    </v-list>
                                </template>
                                <span v-else class="text-body-2 text-medium-emphasis">No instructions provided.</span>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card-text>

            <v-card-actions class="px-6 pb-4">
                <v-spacer />
                <v-btn variant="text" @click="detailDialog = false">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>