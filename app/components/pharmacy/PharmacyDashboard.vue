<script setup lang="ts">
definePageMeta({
    middleware: ['auth'],
})

interface Prescription {
    id: string
    patientName: string
    mrn: string
    doctorName: string
    medicines: string[]
    note: string
    dosage: string | null
    frequency: string | null
    duration: string | null
    status: 'Pending' | 'Verified' | 'Dispensed' | 'Rejected'
    requestedAt: string
}

interface StockItem {
    id: string
    medicineName: string
    dosage: string
    batchNumber: string
    quantity: number
    minimumStock: number
    unit: string
    updatedAt: string
}

interface StockMovement {
    id: string
    type: 'Incoming' | 'Outgoing'
    medicineName: string
    quantity: number
    reasonOrSupplier: string
    createdAt: string
}

const route = useRoute()
const slug = route.params.slug as string

const { data: prescriptionsData } = await useFetch<Prescription[]>('/api/pharmacy/prescriptions')
const { data: stocksData } = await useFetch<StockItem[]>('/api/pharmacy/stocks')
const { data: movementsData } = await useFetch<StockMovement[]>('/api/pharmacy/stock-movements')

const prescriptions = computed(() => prescriptionsData.value ?? [])
const stocks = computed(() => stocksData.value ?? [])
const movements = computed(() => movementsData.value ?? [])

const lowStockItems = computed(() =>
    stocks.value.filter((s) => s.quantity <= s.minimumStock)
)

const recentMovements = computed(() => movements.value.slice(0, 5))
const recentPrescriptions = computed(() => prescriptions.value.slice(0, 5))

const summary = computed(() => ({
    incomingCount: prescriptions.value.filter((p) => p.status === 'Pending').length,
    verifiedCount: prescriptions.value.filter((p) => p.status === 'Verified').length,
    dispensedCount: prescriptions.value.filter((p) => p.status === 'Dispensed').length,
    lowStockCount: lowStockItems.value.length,
    incomingMovementCount: movements.value.filter((m) => m.type === 'Incoming').length,
    outgoingMovementCount: movements.value.filter((m) => m.type === 'Outgoing').length,
}))

const statCards = computed(() => [
    {
        title: 'Incoming Prescriptions',
        value: summary.value.incomingCount,
        caption: 'Waiting for verification',
        to: `/${slug}/pharmacy/prescriptions`,
        icon: 'mdi-prescription',
        color: 'primary',
    },
    {
        title: 'Verified',
        value: summary.value.verifiedCount,
        caption: 'Ready for dispensing',
        to: `/${slug}/pharmacy/prescriptions`,
        icon: 'mdi-check-decagram-outline',
        color: 'success',
    },
    {
        title: 'Dispensed',
        value: summary.value.dispensedCount,
        caption: 'Medicines already handed over',
        to: `/${slug}/pharmacy/prescriptions`,
        icon: 'mdi-medical-bag',
        color: 'info',
    },
    {
        title: 'Low Stock',
        value: summary.value.lowStockCount,
        caption: 'Items need replenishment',
        to: `/${slug}/pharmacy/stock`,
        icon: 'mdi-alert-outline',
        color: 'error',
    },
    {
        title: 'Incoming Stock',
        value: summary.value.incomingMovementCount,
        caption: 'Purchase or transfer in',
        to: `/${slug}/pharmacy/stock-movements`,
        icon: 'mdi-arrow-down-circle-outline',
        color: 'secondary',
    },
    {
        title: 'Outgoing Stock',
        value: summary.value.outgoingMovementCount,
        caption: 'Dispense or transfer out',
        to: `/${slug}/pharmacy/stock-movements`,
        icon: 'mdi-arrow-up-circle-outline',
        color: 'warning',
    },
])

const prescriptionStatusColor: Record<string, string> = {
    Pending: 'primary',
    Verified: 'success',
    Dispensed: 'info',
    Rejected: 'error',
}

function stockStatusColor(quantity: number, minimum: number) {
    if (quantity <= minimum) return 'error'
    if (quantity <= minimum + 10) return 'warning'
    return 'success'
}

function formatDateTime(value: string) {
    return new Date(value).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })
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
                <v-btn color="primary" variant="flat" :to="`/${slug}/pharmacy/prescriptions`">Review
                    prescriptions</v-btn>
                <v-btn color="secondary" variant="tonal" :to="`/${slug}/pharmacy/stock`">Check stock</v-btn>
            </div>
        </div>
    </v-card-text>

    <v-row>
        <v-col v-for="card in statCards" :key="card.title" cols="12" sm="6" lg="4">
            <v-card elevation="0" border :to="card.to" class="h-100 pharmacy-stat-card">
                <v-card-text class="d-flex flex-column ga-2">
                    <div class="d-flex align-center justify-space-between">
                        <div class="text-caption text-medium-emphasis text-uppercase">{{ card.title }}</div>
                        <v-avatar size="34" :color="card.color" variant="tonal">
                            <v-icon :icon="card.icon" size="19" />
                        </v-avatar>
                    </div>
                    <div class="text-h3 font-weight-bold">{{ card.value }}</div>
                    <div class="text-body-2 text-medium-emphasis">{{ card.caption }}</div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>

    <v-row class="mt-4">
        <v-col cols="12" lg="7">
            <v-card elevation="0" border class="h-100">
                <v-card-item class="pb-2">
                    <v-card-title class="text-h5">Incoming Prescriptions</v-card-title>
                    <v-card-subtitle>Recently submitted prescriptions that need review</v-card-subtitle>
                </v-card-item>
                <v-divider />
                <v-table hover density="comfortable">
                    <thead class="bg-containerBg">
                        <tr>
                            <th class="text-left text-caption font-weight-bold text-uppercase">Patient</th>
                            <th class="text-left text-caption font-weight-bold text-uppercase">Medicine</th>
                            <th class="text-left text-caption font-weight-bold text-uppercase">Doctor</th>
                            <th class="text-left text-caption font-weight-bold text-uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="recentPrescriptions.length === 0">
                            <td colspan="4" class="text-center py-6 text-medium-emphasis">No prescriptions found</td>
                        </tr>
                        <tr v-else v-for="item in recentPrescriptions" :key="item.id">
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
                                <v-chip size="small" variant="tonal"
                                    :color="prescriptionStatusColor[item.status] ?? 'default'">
                                    {{ item.status }}
                                </v-chip>
                            </td>
                        </tr>
                    </tbody>
                </v-table>
            </v-card>
        </v-col>

        <v-col cols="12" lg="5">
            <v-card elevation="0" border class="mb-4">
                <v-card-item class="pb-2">
                    <v-card-title class="text-h5">Low Stock Alerts</v-card-title>
                    <v-card-subtitle>Medicines that need replenishment soon</v-card-subtitle>
                </v-card-item>
                <v-divider />
                <v-card-text class="d-flex flex-column ga-3">
                    <div v-if="lowStockItems.length === 0" class="text-center py-4 text-medium-emphasis">
                        <v-icon icon="mdi-check-circle-outline" size="32" class="mb-2 d-block mx-auto"
                            color="success" />
                        All stock levels are healthy
                    </div>
                    <div v-else v-for="item in lowStockItems" :key="item.id"
                        class="d-flex align-center justify-space-between ga-3">
                        <div>
                            <div class="text-body-2 font-weight-medium">{{ item.medicineName }}</div>
                            <div class="text-caption text-medium-emphasis">
                                {{ item.batchNumber }} · min {{ item.minimumStock }} {{ item.unit }}
                            </div>
                        </div>
                        <v-chip size="small" variant="tonal"
                            :color="stockStatusColor(item.quantity, item.minimumStock)">
                            {{ item.quantity }} {{ item.unit }}
                        </v-chip>
                    </div>
                </v-card-text>
            </v-card>

            <v-card elevation="0" border>
                <v-card-item class="pb-2">
                    <v-card-title class="text-h5">Recent Stock Movement</v-card-title>
                    <v-card-subtitle>Incoming and outgoing movement log</v-card-subtitle>
                </v-card-item>
                <v-divider />
                <v-card-text class="d-flex flex-column ga-4">
                    <div v-if="recentMovements.length === 0" class="text-center py-4 text-medium-emphasis">
                        No movement records
                    </div>
                    <div v-else v-for="movement in recentMovements" :key="movement.id" class="d-flex flex-column ga-1">
                        <div class="d-flex align-center justify-space-between ga-3">
                            <div class="text-body-2 font-weight-medium">{{ movement.medicineName }}</div>
                            <v-chip size="x-small" variant="tonal"
                                :color="movement.type === 'Incoming' ? 'success' : 'warning'">
                                {{ movement.type }}
                            </v-chip>
                        </div>
                        <div class="text-caption text-medium-emphasis">
                            {{ movement.quantity }} units · {{ movement.reasonOrSupplier }}
                        </div>
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
    cursor: pointer;
}

.pharmacy-stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}
</style>