<script setup lang="ts">
import usePharmacyWorkspace from '~/composables/usePharmacyWorkspace'

const workspace = usePharmacyWorkspace()
const recentPrescriptions = workspace.recentPrescriptions
const lowStockItems = workspace.lowStockItems
const recentMovements = workspace.recentMovements

const statCards = computed(() => [
    {
        title: 'Incoming Prescriptions',
        value: workspace.summary.value.incomingCount.toString(),
        caption: 'Waiting for verification',
        to: '/pharmacy/prescriptions',
        color: 'primary',
    },
    {
        title: 'Verified',
        value: workspace.summary.value.verifiedCount.toString(),
        caption: 'Ready for dispensing',
        to: '/pharmacy/verification',
        color: 'success',
    },
    {
        title: 'Dispensed',
        value: workspace.summary.value.dispensedCount.toString(),
        caption: 'Medicines already handed over',
        to: '/pharmacy/dispensing',
        color: 'info',
    },
    {
        title: 'Low Stock',
        value: workspace.summary.value.lowStockCount.toString(),
        caption: 'Items need replenishment',
        to: '/pharmacy/stock',
        color: 'error',
    },
    {
        title: 'Incoming Stock',
        value: workspace.summary.value.incomingMovementCount.toString(),
        caption: 'Purchase or transfer in',
        to: '/pharmacy/stock-in',
        color: 'secondary',
    },
    {
        title: 'Outgoing Stock',
        value: workspace.summary.value.outgoingMovementCount.toString(),
        caption: 'Dispense or transfer out',
        to: '/pharmacy/stock-out',
        color: 'warning',
    },
])

function formatDateTime(value: string) {
    return new Date(value).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })
}

function stockStatusColor(stock: number, minimumStock: number) {
    if (stock <= minimumStock) return 'error'
    if (stock <= minimumStock + 10) return 'warning'
    return 'success'
}
</script>

<template>
    <v-card-text class="py-6">
        <div class="d-flex flex-wrap align-center justify-space-between ga-4">
            <div>
                <div class="text-caption text-medium-emphasis text-uppercase">Pharmacy Dashboard</div>
                <h3 class="text-h3 mb-2">Prescription and stock operations</h3>
                <p class="text-body-1 text-medium-emphasis mb-0">
                    Track incoming prescriptions, verification, dispensing, and drug inventory in one place.
                </p>
            </div>
            <div class="d-flex ga-3 flex-wrap">
                <v-btn color="primary" variant="flat" to="/pharmacy/prescriptions">Review prescriptions</v-btn>
                <v-btn color="secondary" variant="tonal" to="/pharmacy/stock">Check stock</v-btn>
            </div>
        </div>
    </v-card-text>

    <v-row>
        <v-col v-for="card in statCards" :key="card.title" cols="12" sm="6" lg="4">
            <v-card elevation="0" :to="card.to" class="h-100 pharmacy-stat-card">
                <v-card-text class="d-flex flex-column ga-2">
                    <div class="text-caption text-medium-emphasis text-uppercase">{{ card.title }}</div>
                    <div class="text-h3 font-weight-bold">{{ card.value }}</div>
                    <div class="text-body-2 text-medium-emphasis">{{ card.caption }}</div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>

    <v-row class="mt-4">
        <v-col cols="12" lg="7">
            <v-card elevation="0" class="h-100">
                <v-card-item class="pb-2">
                    <v-card-title class="text-h5">Incoming Prescriptions</v-card-title>
                    <v-card-subtitle>Recently submitted prescriptions that need review</v-card-subtitle>
                </v-card-item>

                <v-divider />

                <v-table hover density="comfortable">
                    <thead class="bg-containerBg">
                        <tr>
                            <th class="text-left text-caption font-weight-bold text-uppercase">Patient</th>
                            <th class="text-left text-caption font-weight-bold text-uppercase">Medicines</th>
                            <th class="text-left text-caption font-weight-bold text-uppercase">Doctor</th>
                            <th class="text-left text-caption font-weight-bold text-uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in recentPrescriptions" :key="item.id">
                            <td class="py-3">
                                <div class="text-body-2 font-weight-medium">{{ item.patientName }}</div>
                                <div class="text-caption text-medium-emphasis">{{ item.mrn }}</div>
                            </td>
                            <td class="py-3">
                                <div class="text-body-2">{{ item.medicines.join(', ') }}</div>
                                <div class="text-caption text-medium-emphasis">{{ item.note }}</div>
                            </td>
                            <td class="py-3 text-body-2 text-medium-emphasis">{{ item.doctorName }}</td>
                            <td class="py-3">
                                <v-chip
                                    size="small"
                                    variant="tonal"
                                    :color="item.status === 'Pending' ? 'primary' : item.status === 'Verified' ? 'success' : item.status === 'Dispensed' ? 'info' : 'error'"
                                >
                                    {{ item.status }}
                                </v-chip>
                            </td>
                        </tr>
                    </tbody>
                </v-table>
            </v-card>
        </v-col>

        <v-col cols="12" lg="5">
            <v-card elevation="0" class="mb-4">
                <v-card-item class="pb-2">
                    <v-card-title class="text-h5">Low Stock Alerts</v-card-title>
                    <v-card-subtitle>Medicines that need replenishment soon</v-card-subtitle>
                </v-card-item>

                <v-divider />

                <v-card-text class="d-flex flex-column ga-3">
                    <div v-for="item in lowStockItems" :key="item.id" class="d-flex align-center justify-space-between ga-3">
                        <div>
                            <div class="text-body-2 font-weight-medium">{{ item.medicineName }}</div>
                            <div class="text-caption text-medium-emphasis">{{ item.batchNumber }} · min {{ item.minimumStock }} {{ item.unit }}</div>
                        </div>
                        <v-chip size="small" variant="tonal" :color="stockStatusColor(item.quantity, item.minimumStock)">
                            {{ item.quantity }} {{ item.unit }}
                        </v-chip>
                    </div>
                    <div v-if="lowStockItems.length === 0" class="text-medium-emphasis">
                        No low stock items right now.
                    </div>
                </v-card-text>
            </v-card>

            <v-card elevation="0">
                <v-card-item class="pb-2">
                    <v-card-title class="text-h5">Recent Stock Movement</v-card-title>
                    <v-card-subtitle>Incoming and outgoing movement log</v-card-subtitle>
                </v-card-item>

                <v-divider />

                <v-card-text class="d-flex flex-column ga-4">
                    <div v-for="movement in recentMovements" :key="movement.id" class="d-flex flex-column ga-1">
                        <div class="d-flex align-center justify-space-between ga-3">
                            <div class="text-body-2 font-weight-medium">{{ movement.medicineName }}</div>
                            <v-chip size="x-small" variant="tonal" :color="movement.type === 'Incoming' ? 'success' : 'warning'">
                                {{ movement.type }}
                            </v-chip>
                        </div>
                        <div class="text-caption text-medium-emphasis">{{ movement.quantity }} units · {{ movement.reasonOrSupplier }}</div>
                        <div class="text-caption text-medium-emphasis">{{ formatDateTime(movement.createdAt) }}</div>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>
</template>

<style scoped>
.pharmacy-stat-card {
    transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.pharmacy-stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}
</style>
