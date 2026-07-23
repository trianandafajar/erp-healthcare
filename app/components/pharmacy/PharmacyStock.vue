<script setup lang="ts">
import usePharmacyWorkspace from '~/composables/usePharmacyWorkspace'
import type { StockItem } from '~/types/pharmacy'

const { can } = usePermission()
const workspace = usePharmacyWorkspace()
const search = ref('')
const stockFilter = ref<'all' | 'low'>('all')
const currentPage = ref(1)
const dialog = ref(false)
const mode = ref<'create' | 'edit'>('create')
const adjustDialog = ref(false)
const selectedId = ref<string | null>(null)
const itemsPerPage = 8

const loadingSave = ref(false)
const loadingAdjust = ref(false)

const form = reactive({
    medicineName: '',
    dosage: '',
    supplier: '',
    batchNumber: '',
    expiredDate: '',
    quantity: 0,
    minimumStock: 20,
    unit: 'tablet',
})

const adjustForm = reactive({
    quantityDelta: 0,
})

const stockItems = computed(() => workspace.stocks.value)

function medicineLabel(item: Pick<StockItem, 'medicineName' | 'dosage'>) {
    return item.dosage?.trim()
        ? `${item.medicineName.trim()} ${item.dosage.trim()}`
        : item.medicineName.trim()
}

const filteredStock = computed(() => {
    const keyword = search.value.trim().toLowerCase()

    return stockItems.value.filter((item) => {
        const matchFilter = stockFilter.value === 'all' || item.quantity <= item.minimumStock
        const matchKeyword =
            !keyword ||
            medicineLabel(item).toLowerCase().includes(keyword) ||
            item.supplier.toLowerCase().includes(keyword) ||
            item.batchNumber.toLowerCase().includes(keyword)

        return matchFilter && matchKeyword
    })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredStock.value.length / itemsPerPage)))
const safeCurrentPage = computed(() => Math.min(currentPage.value, totalPages.value))

const paginatedStock = computed(() => {
    const start = (safeCurrentPage.value - 1) * itemsPerPage
    return filteredStock.value.slice(start, start + itemsPerPage)
})

const selectedStock = computed(() =>
    stockItems.value.find((item) => item.id === selectedId.value) ?? null,
)

const isSaveFormValid = computed(() =>
    !!form.medicineName.trim() &&
    !!form.dosage.trim() &&
    !!form.supplier.trim() &&
    !!form.batchNumber.trim() &&
    !!form.expiredDate &&
    form.quantity > 0
)

const isAdjustFormValid = computed(() =>
    !!selectedId.value && adjustForm.quantityDelta !== 0
)

function resetForm() {
    form.medicineName = ''
    form.dosage = ''
    form.supplier = ''
    form.batchNumber = ''
    form.expiredDate = ''
    form.quantity = 0
    form.minimumStock = 20
    form.unit = 'tablet'
}

function openCreate() {
    mode.value = 'create'
    selectedId.value = null
    resetForm()
    dialog.value = true
}

watch([search, stockFilter], () => {
    currentPage.value = 1
})

function openEdit(item: StockItem) {
    mode.value = 'edit'
    selectedId.value = item.id
    form.medicineName = item.medicineName
    form.dosage = item.dosage ?? ''
    form.supplier = item.supplier
    form.batchNumber = item.batchNumber
    form.expiredDate = item.expiredDate.slice(0, 10)
    form.quantity = item.quantity
    form.minimumStock = item.minimumStock
    form.unit = item.unit
    dialog.value = true
}

function openAdjust(item: StockItem) {
    selectedId.value = item.id
    adjustForm.quantityDelta = 0
    adjustDialog.value = true
}

async function saveStock() {
    if (!isSaveFormValid.value) return

    loadingSave.value = true
    try {
        await workspace.upsertStockMedicine({
            id: selectedId.value ?? undefined,
            medicineName: form.medicineName.trim(),
            dosage: form.dosage.trim(),
            supplier: form.supplier.trim(),
            batchNumber: form.batchNumber.trim(),
            expiredDate: new Date(form.expiredDate).toISOString(),
            quantity: Number(form.quantity),
            minimumStock: Number(form.minimumStock),
            unit: form.unit.trim() || 'tablet',
        })
        dialog.value = false
    } finally {
        loadingSave.value = false
    }
}

async function saveAdjust() {
    if (!isAdjustFormValid.value) return

    loadingAdjust.value = true
    try {
        await workspace.adjustStock(selectedId.value!, Number(adjustForm.quantityDelta))
        adjustDialog.value = false
    } finally {
        loadingAdjust.value = false
    }
}

function lowStockColor(item: StockItem) {
    if (item.quantity <= item.minimumStock) return 'error'
    if (item.quantity <= item.minimumStock + 10) return 'warning'
    return 'success'
}

function formatDate(value: string) {
    return new Date(value).toLocaleDateString('en-US', {
        dateStyle: 'medium',
    })
}
</script>
<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex flex-wrap align-center justify-space-between ga-3">
            <div>
                <div class="text-caption text-uppercase text-medium-emphasis">Pharmacy Inventory</div>
                <v-card-title class="text-h4">Medicine Stock</v-card-title>
                <v-card-subtitle class="mt-1">
                    Search medicines, watch low stock items, and manage inventory adjustments.
                </v-card-subtitle>
            </div>
            <v-btn v-if="can('stock.create')" color="primary" variant="flat" prepend-icon="mdi-plus"
                @click="openCreate">
                Add Medicine
            </v-btn>
        </div>
    </v-card-item>

    <v-card elevation="0">
        <v-card-text class="d-flex flex-column ga-4">
            <v-row dense>
                <v-col cols="12" md="7">
                    <v-text-field v-model="search" label="Search medicine"
                        placeholder="Search medicine, dosage, supplier, or batch number"
                        prepend-inner-icon="mdi-magnify" variant="outlined" density="comfortable" hide-details
                        clearable />
                </v-col>
                <v-col cols="12" md="5">
                    <v-select v-model="stockFilter" :items="[
                        { title: 'All stock', value: 'all' },
                        { title: 'Low stock only', value: 'low' },
                    ]" item-title="title" item-value="value" label="Filter" variant="outlined" density="comfortable"
                        hide-details />
                </v-col>
            </v-row>

            <v-table hover density="comfortable">
                <thead class="bg-containerBg">
                    <tr>
                        <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Medicine</th>
                        <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Dosage</th>
                        <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Supplier / Batch</th>
                        <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Expiry</th>
                        <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Stock</th>
                        <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Status</th>
                        <th class="text-no-wrap text-right text-caption font-weight-bold text-uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="filteredStock.length === 0">
                        <td colspan="7" class="text-center py-8 text-medium-emphasis">
                            No medicines found
                        </td>
                    </tr>
                    <tr v-else v-for="item in paginatedStock" :key="item.id">
                        <td class="py-3">
                            <div class="text-body-2 font-weight-medium">{{ medicineLabel(item) }}</div>
                            <div class="text-caption text-medium-emphasis">{{ item.unit }}</div>
                        </td>
                        <td class="py-3 text-body-2">
                            {{ item.dosage || '-' }}
                        </td>
                        <td class="py-3">
                            <div class="text-body-2">{{ item.supplier }}</div>
                            <div class="text-caption text-medium-emphasis">{{ item.batchNumber }}</div>
                        </td>
                        <td class="py-3 text-body-2">{{ formatDate(item.expiredDate) }}</td>
                        <td class="py-3 text-body-2">{{ item.quantity }} {{ item.unit }}</td>
                        <td class="py-3">
                            <v-chip size="small" variant="tonal" :color="lowStockColor(item)">
                                {{ item.quantity <= item.minimumStock ? 'Low Stock' : 'Healthy' }} </v-chip>
                        </td>
                        <td class="py-3 text-right">
                            <v-btn v-if="can('stock.edit')" size="small" variant="text" color="secondary"
                                @click="openEdit(item)">
                                Edit
                            </v-btn>
                            <v-btn v-if="can('stock.adjust')" size="small" variant="text" color="warning"
                                @click="openAdjust(item)">
                                Adjust Stock
                            </v-btn>
                        </td>
                    </tr>
                </tbody>
            </v-table>

            <div v-if="filteredStock.length > itemsPerPage"
                class="d-flex flex-wrap align-center justify-space-between ga-3 pt-2">
                <div class="text-body-2 text-medium-emphasis">
                    Showing {{ Math.min((safeCurrentPage - 1) * itemsPerPage + 1, filteredStock.length) }}-{{
                        Math.min(safeCurrentPage * itemsPerPage, filteredStock.length) }} of {{ filteredStock.length }}
                    medicines
                </div>
                <v-pagination v-model="currentPage" :length="totalPages" :total-visible="6" density="compact"
                    rounded="circle" show-first-last-page />
            </div>
        </v-card-text>
    </v-card>

    <v-dialog v-model="dialog" max-width="640" persistent>
        <v-card rounded="lg">
            <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
                <div class="d-flex align-center ga-2">
                    <v-icon icon="mdi-pill" size="20" />
                    <span class="text-h6 font-weight-bold">
                        {{ mode === 'create' ? 'Add Medicine' : 'Edit Medicine' }}
                    </span>
                </div>

                <v-btn icon="mdi-close" variant="text" density="compact" @click="dialog = false" />
            </v-card-title>

            <v-divider />

            <v-card-text class="pa-4">
                <v-label class="text-caption font-weight-medium mb-1">Medicine Name</v-label>
                <v-text-field v-model="form.medicineName" placeholder="e.g. Paracetamol" variant="outlined"
                    density="compact" hide-details="auto" class="mb-4" />

                <v-row dense>
                    <v-col cols="12" sm="6">
                        <v-label class="text-caption font-weight-medium mb-1">Dosage</v-label>
                        <v-text-field v-model="form.dosage" placeholder="e.g. 500 mg" variant="outlined"
                            density="compact" hide-details="auto" />
                    </v-col>

                    <v-col cols="12" sm="6">
                        <v-label class="text-caption font-weight-medium mb-1">Unit</v-label>
                        <v-select v-model="form.unit"
                            :items="['tablet', 'capsule', 'sachet', 'bottle', 'ampoule', 'vial', 'box', 'tube', 'pen']"
                            variant="outlined" density="compact" hide-details="auto" />
                    </v-col>
                </v-row>

                <v-divider class="my-4" />

                <v-row dense>
                    <v-col cols="12" sm="4">
                        <v-label class="text-caption font-weight-medium mb-1">Current Stock</v-label>
                        <v-text-field v-model.number="form.quantity" type="number" min="0" variant="outlined"
                            density="compact" hide-details="auto"
                            :rules="[v => v >= 0 || 'Must be non-negative']"
                            @keydown="e => { if (e.key === '-') e.preventDefault() }" />
                    </v-col>

                    <v-col cols="12" sm="4">
                        <v-label class="text-caption font-weight-medium mb-1">Minimum Stock</v-label>
                        <v-text-field v-model.number="form.minimumStock" type="number" min="0" variant="outlined"
                            density="compact" hide-details="auto"
                            :rules="[v => v >= 0 || 'Must be non-negative']"
                            @keydown="e => { if (e.key === '-') e.preventDefault() }" />
                    </v-col>

                    <v-col cols="12" sm="4">
                        <v-label class="text-caption font-weight-medium mb-1">Expired Date</v-label>
                        <v-text-field v-model="form.expiredDate" type="date" variant="outlined" density="compact"
                            hide-details="auto" />
                    </v-col>
                </v-row>

                <v-divider class="my-4" />

                <v-row dense>
                    <v-col cols="12" sm="6">
                        <v-label class="text-caption font-weight-medium mb-1">Supplier</v-label>
                        <v-text-field v-model="form.supplier" placeholder="e.g. PT Medika Prima" variant="outlined"
                            density="compact" hide-details="auto" />
                    </v-col>

                    <v-col cols="12" sm="6">
                        <v-label class="text-caption font-weight-medium mb-1">Batch Number</v-label>
                        <v-text-field v-model="form.batchNumber" placeholder="B-PR-2606" variant="outlined"
                            density="compact" hide-details="auto" />
                    </v-col>
                </v-row>
            </v-card-text>

            <v-divider />

            <v-card-actions class="pa-4 pt-3">
                <v-spacer />

                <v-btn variant="tonal" color="secondary"
                    :style="!isAdjustFormValid || loadingAdjust ? 'cursor: not-allowed; pointer-events: auto;' : ''"
                    :disabled="loadingSave" @click="dialog = false">
                    Cancel
                </v-btn>

                <v-btn color="primary" variant="flat" min-width="120" :loading="loadingSave"
                    :style="!isSaveFormValid || loadingSave ? 'cursor: not-allowed; pointer-events: auto;' : ''"
                    :disabled="!isSaveFormValid || loadingSave" @click="saveStock">
                    {{ mode === 'create' ? 'Add Medicine' : 'Save Changes' }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="adjustDialog" max-width="480" persistent>
        <v-card rounded="lg">
            <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
                <div class="d-flex align-center ga-2">
                    <v-icon icon="mdi-tune" size="20" />
                    <span class="text-h6 font-weight-bold">Adjust Stock</span>
                </div>

                <v-btn icon="mdi-close" variant="text" density="compact" @click="adjustDialog = false" />
            </v-card-title>

            <v-divider />

            <v-card-text class="pa-4">
                <v-alert variant="tonal" density="compact" icon="mdi-pill" class="mb-4">
                    <template #title>
                        <span class="font-weight-medium">{{ selectedStock?.medicineName || 'Selected medicine' }}</span>
                    </template>
                    <template #text>
                        {{ selectedStock?.dosage || '-' }} &middot; Current stock:
                        <strong>{{ selectedStock?.quantity ?? 0 }} {{ selectedStock?.unit || '' }}</strong>
                    </template>
                </v-alert>

                <v-label class="text-caption font-weight-medium mb-1">Quantity Delta</v-label>
                <v-text-field v-model.number="adjustForm.quantityDelta" type="number" variant="outlined"
                    density="compact" hide-details="auto" placeholder="e.g. 10 or -5" />

                <div class="mt-3 text-caption text-medium-emphasis">
                    Use positive value to add stock, negative value to reduce stock.
                </div>
            </v-card-text>

            <v-divider />

            <v-card-actions class="pa-4 pt-3">
                <v-spacer />

                <v-btn variant="tonal" color="secondary"
                    :style="!isAdjustFormValid || loadingAdjust ? 'cursor: not-allowed; pointer-events: auto;' : ''"
                    :disabled="loadingAdjust" @click="adjustDialog = false">
                    Cancel
                </v-btn>

                <v-btn :style="!isAdjustFormValid || loadingAdjust ? 'cursor: not-allowed; pointer-events: auto;' : ''"
                    color="warning" variant="flat" min-width="120" :loading="loadingAdjust"
                    :disabled="!isAdjustFormValid || loadingAdjust" @click="saveAdjust">
                    Apply Adjustment
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style scoped></style>
