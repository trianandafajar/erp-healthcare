<script setup lang="ts">
import usePharmacyWorkspace from '~/composables/usePharmacyWorkspace'
import type { StockMovementItem, StockMovementType } from '~/types/pharmacy'

const props = defineProps<{
    type: StockMovementType
}>()

const workspace = usePharmacyWorkspace()
const search = ref('')
const currentPage = ref(1)
const detailDialog = ref(false)
const selectedId = ref<string | null>(null)
const itemsPerPage = 8

function medicineLabel(item: { medicineName: string; dosage?: string | null }) {
    return item.dosage?.trim() ? `${item.medicineName} ${item.dosage}` : item.medicineName
}

const movements = computed(() => workspace.movements.value.filter((item) => item.type === props.type))

const filteredMovements = computed(() => {
    const query = search.value.trim().toLowerCase()

    if (!query) return movements.value

    return movements.value.filter((item) => {
        return [
            medicineLabel(item),
            item.reference,
            item.reasonOrSupplier,
            item.note,
            item.batchNumber,
            item.expiredDate,
            item.performedBy,
        ]
            .join(' ')
            .toLowerCase()
            .includes(query)
    })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredMovements.value.length / itemsPerPage)))
const safeCurrentPage = computed(() => Math.min(currentPage.value, totalPages.value))

const paginatedMovements = computed(() => {
    const start = (safeCurrentPage.value - 1) * itemsPerPage
    return filteredMovements.value.slice(start, start + itemsPerPage)
})

const selectedMovement = computed(() => filteredMovements.value.find((item) => item.id === selectedId.value) ?? movements.value.find((item) => item.id === selectedId.value) ?? null)

function openDetail(item: StockMovementItem) {
    selectedId.value = item.id
    detailDialog.value = true
}

watch(search, () => {
    currentPage.value = 1
})

function formatDateTime(value: string) {
    return new Date(value).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })
}

function formatDate(value: string) {
    return new Date(value).toLocaleDateString('en-US', {
        dateStyle: 'medium',
    })
}

const pageTitle = computed(() => (props.type === 'Incoming' ? 'Incoming Stock Logs' : 'Outgoing Stock Logs'))
const pageSubtitle = computed(() =>
    props.type === 'Incoming'
        ? 'View-only incoming stock history. Every receipt is recorded from inventory changes.'
        : 'View-only outgoing and adjustment history. All edits belong in Medicine Stock.',
)

const metaLabel = computed(() => (props.type === 'Incoming' ? 'Supplier' : 'Reason'))
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex flex-wrap align-center justify-space-between ga-3">
            <div>
                <div class="text-caption text-uppercase text-medium-emphasis">Pharmacy Inventory</div>
                <v-card-title class="text-h4">{{ pageTitle }}</v-card-title>
                <v-card-subtitle class="mt-1">
                    {{ pageSubtitle }}
                </v-card-subtitle>
            </div>
        </div>
    </v-card-item>

    <v-card elevation="0">
        <v-card-text class="d-flex flex-column ga-4 px-0">
            <div class="d-flex flex-wrap align-center ga-3">
                <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Search logs"
                    placeholder="Search medicine, reference, supplier, reason, or note" variant="outlined"
                    density="comfortable" hide-details class="pharmacy-log-search" />
            </div>

            <v-table hover density="comfortable" class="pharmacy-log-table">
                <thead class="bg-containerBg">
                    <tr>
                        <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Medicine</th>
                        <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Reference</th>
                        <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">{{ metaLabel }}</th>
                        <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Quantity</th>
                        <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Batch / Expiry</th>
                        <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Performed By</th>
                        <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Logged At</th>
                        <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Note</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="filteredMovements.length === 0">
                        <td colspan="8" class="text-center py-8 text-medium-emphasis">
                            No logs found
                        </td>
                    </tr>
                    <tr v-else v-for="movement in paginatedMovements" :key="movement.id" class="pharmacy-log-row"
                        @click="openDetail(movement)">
                        <td class="py-3">
                            <div class="text-body-2 font-weight-medium">{{ medicineLabel(movement) }}</div>
                        </td>
                        <td class="py-3">
                            <div class="text-body-2">{{ movement.reference }}</div>
                        </td>
                        <td class="py-3">
                            <div class="text-body-2">{{ movement.reasonOrSupplier }}</div>
                            <div class="text-caption text-medium-emphasis" v-if="props.type === 'Incoming'">
                                Supplier receipt
                            </div>
                            <div class="text-caption text-medium-emphasis" v-else>
                                Inventory adjustment or outgoing log
                            </div>
                        </td>
                        <td class="py-3">
                            <div class="text-body-2 font-weight-medium">{{ movement.quantity }}</div>
                        </td>
                        <td class="py-3">
                            <div class="text-body-2" v-if="props.type === 'Incoming'">
                                {{ movement.batchNumber }}
                            </div>
                            <div class="text-caption text-medium-emphasis" v-if="props.type === 'Incoming'">
                                {{ formatDate(movement.expiredDate) }}
                            </div>
                            <div class="text-body-2" v-else>
                                {{ formatDateTime(movement.createdAt) }}
                            </div>
                        </td>
                        <td class="py-3 text-body-2">
                            {{ movement.performedBy || '-' }}
                        </td>
                        <td class="py-3 text-body-2 text-medium-emphasis">
                            {{ formatDateTime(movement.createdAt) }}
                        </td>
                        <td class="py-3 text-body-2">
                            {{ movement.note || '-' }}
                        </td>
                    </tr>
                </tbody>
            </v-table>

            <div v-if="filteredMovements.length > itemsPerPage"
                class="d-flex flex-wrap align-center justify-space-between ga-3 pt-2">
                <div class="text-body-2 text-medium-emphasis">
                    Showing {{ Math.min((safeCurrentPage - 1) * itemsPerPage + 1, filteredMovements.length) }}-{{
                        Math.min(safeCurrentPage * itemsPerPage, filteredMovements.length) }} of {{ filteredMovements.length
                    }} logs
                </div>
                <v-pagination 
                    v-model="currentPage" 
                    :length="totalPages" 
                    :total-visible="6" 
                    density="compact"
                    rounded="circle" 
                    show-first-last-page
                />
            </div>
        </v-card-text>
    </v-card>

    <v-dialog v-model="detailDialog" max-width="620">
        <v-card v-if="selectedMovement">
            <v-card-title class="text-h6">Log Detail</v-card-title>
            <v-card-text>
                <v-row dense>
                    <v-col cols="12" md="6">
                        <div class="text-caption text-medium-emphasis">Medicine</div>
                        <div class="text-body-1 font-weight-medium">{{ medicineLabel(selectedMovement) }}</div>
                    </v-col>
                    <v-col cols="12" md="6">
                        <div class="text-caption text-medium-emphasis">Reference</div>
                        <div class="text-body-1 font-weight-medium">{{ selectedMovement.reference }}</div>
                    </v-col>
                    <v-col cols="12" md="6">
                        <div class="text-caption text-medium-emphasis">{{ metaLabel }}</div>
                        <div class="text-body-2">{{ selectedMovement.reasonOrSupplier }}</div>
                    </v-col>
                    <v-col cols="12" md="6">
                        <div class="text-caption text-medium-emphasis">Quantity</div>
                        <div class="text-body-2">{{ selectedMovement.quantity }}</div>
                    </v-col>
                    <v-col cols="12" md="6">
                        <div class="text-caption text-medium-emphasis">Performed By</div>
                        <div class="text-body-2">{{ selectedMovement.performedBy || '-' }}</div>
                    </v-col>
                    <v-col cols="12" md="6" v-if="props.type === 'Incoming'">
                        <div class="text-caption text-medium-emphasis">Batch Number</div>
                        <div class="text-body-2">{{ selectedMovement.batchNumber }}</div>
                    </v-col>
                    <v-col cols="12" md="6" v-if="props.type === 'Incoming'">
                        <div class="text-caption text-medium-emphasis">Expired Date</div>
                        <div class="text-body-2">{{ formatDate(selectedMovement.expiredDate) }}</div>
                    </v-col>
                    <v-col cols="12">
                        <div class="text-caption text-medium-emphasis">Note</div>
                        <div class="text-body-2">{{ selectedMovement.note || '-' }}</div>
                    </v-col>
                    <v-col cols="12">
                        <div class="text-caption text-medium-emphasis">Logged At</div>
                        <div class="text-body-2">{{ formatDateTime(selectedMovement.createdAt) }}</div>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-card-actions class="justify-end">
                <v-btn variant="text" @click="detailDialog = false">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style scoped>
.pharmacy-log-search {
    max-width: 560px;
    flex: 1 1 360px;
}

.pharmacy-log-table :deep(tbody tr) {
    cursor: pointer;
}

.pharmacy-log-table :deep(tbody tr:hover) {
    background: rgb(var(--v-theme-surface-variant), 0.08);
}
</style>
