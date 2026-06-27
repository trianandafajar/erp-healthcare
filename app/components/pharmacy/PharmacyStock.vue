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
    if (!form.medicineName.trim() || !form.dosage.trim() || !form.supplier.trim() || !form.batchNumber.trim() || !form.expiredDate || !form.quantity) {
        return
    }

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
}

async function saveAdjust() {
    if (!selectedId.value) return
    await workspace.adjustStock(selectedId.value, Number(adjustForm.quantityDelta))
    adjustDialog.value = false
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
                        <th class="text-left text-caption font-weight-bold text-uppercase">Medicine</th>
                        <th class="text-left text-caption font-weight-bold text-uppercase">Dosage</th>
                        <th class="text-left text-caption font-weight-bold text-uppercase">Supplier / Batch</th>
                        <th class="text-left text-caption font-weight-bold text-uppercase">Expiry</th>
                        <th class="text-left text-caption font-weight-bold text-uppercase">Stock</th>
                        <th class="text-left text-caption font-weight-bold text-uppercase">Status</th>
                        <th class="text-right text-caption font-weight-bold text-uppercase">Actions</th>
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

    <v-dialog v-model="dialog" max-width="860" persistent>
        <v-card class="rounded-2xl">
            <div class="flex items-start justify-between gap-4 border-b px-6 py-5">
                <div>
                    <div class="text-lg font-semibold text-slate-900">
                        {{ mode === 'create' ? 'Add Medicine' : 'Edit Medicine' }}
                    </div>
                    <div class="mt-1 text-sm text-slate-500">
                        Manage medicine stock, batch information, and minimum stock limit.
                    </div>
                </div>

                <v-btn icon="mdi-close" variant="text" size="small" @click="dialog = false" />
            </div>

            <v-card-text class="px-6 py-5">
                <div class="mb-5 rounded-xl border  p-4">
                    <div class="mb-4 text-sm font-semibold text-slate-700">
                        Medicine Information
                    </div>

                    <v-row dense>
                        <v-col cols="12" md="7">
                            <v-text-field v-model="form.medicineName" label="Medicine Name"
                                placeholder="e.g. Paracetamol" variant="outlined" density="comfortable"
                                hide-details="auto" />
                        </v-col>

                        <v-col cols="12" md="5">
                            <v-text-field v-model="form.dosage" label="Dosage" placeholder="e.g. 500 mg"
                                variant="outlined" density="comfortable" hide-details="auto" />
                        </v-col>
                    </v-row>
                </div>

                <div class="mb-5 rounded-xl border p-4">
                    <div class="mb-4 text-sm font-semibold text-slate-700">
                        Stock Information
                    </div>

                    <v-row dense>
                        <v-col cols="12" md="4">
                            <v-text-field v-model.number="form.quantity" label="Current Stock" type="number" min="0"
                                variant="outlined" density="comfortable" hide-details="auto" />
                        </v-col>

                        <v-col cols="12" md="4">
                            <v-text-field v-model.number="form.minimumStock" label="Minimum Stock" type="number" min="0"
                                variant="outlined" density="comfortable" hide-details="auto" />
                        </v-col>

                        <v-col cols="12" md="4">
                            <v-select v-model="form.unit" label="Unit"
                                :items="['tablet', 'capsule', 'sachet', 'bottle', 'ampoule', 'vial', 'box', 'tube', 'pen']"
                                variant="outlined" density="comfortable" hide-details="auto" />
                        </v-col>
                    </v-row>
                </div>

                <div class="rounded-xl border p-4">
                    <div class="mb-4 text-sm font-semibold text-slate-700">
                        Supplier & Batch
                    </div>

                    <v-row dense>
                        <v-col cols="12" md="6">
                            <v-text-field v-model="form.supplier" label="Supplier" placeholder="e.g. PT Medika Prima"
                                variant="outlined" density="comfortable" hide-details="auto" />
                        </v-col>

                        <v-col cols="12" md="3">
                            <v-text-field v-model="form.batchNumber" label="Batch Number" placeholder="B-PR-2606"
                                variant="outlined" density="comfortable" hide-details="auto" />
                        </v-col>

                        <v-col cols="12" md="3">
                            <v-text-field v-model="form.expiredDate" label="Expired Date" type="date" variant="outlined"
                                density="comfortable" hide-details="auto" />
                        </v-col>
                    </v-row>
                </div>
            </v-card-text>

            <v-card-actions class="border-t px-6 py-4">
                <v-spacer />

                <v-btn variant="text" class="text-slate-600" @click="dialog = false">
                    Cancel
                </v-btn>

                <v-btn color="primary" variant="flat" min-width="120" @click="saveStock">
                    Save Medicine
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="adjustDialog" max-width="560" persistent>
        <v-card class="rounded-2xl">
            <div class="flex items-start justify-between gap-4 border-b px-6 py-5">
                <div>
                    <div class="text-lg font-semibold text-slate-900">
                        Adjust Stock
                    </div>
                    <div class="mt-1 text-sm text-slate-500">
                        Add or reduce stock manually for correction, opname, or damaged items.
                    </div>
                </div>

                <v-btn icon="mdi-close" variant="text" size="small" @click="adjustDialog = false" />
            </div>

            <v-card-text class="px-6 py-5">
                <div class="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <div class="text-xs font-medium uppercase tracking-wide text-blue-600">
                        Selected Medicine
                    </div>

                    <div class="mt-1 text-base font-semibold text-slate-900">
                        {{ selectedStock?.medicineName || 'Selected medicine' }}
                    </div>

                    <div class="mt-1 text-sm text-slate-600">
                        {{ selectedStock?.dosage || '-' }} · Current stock:
                        <span class="font-medium text-slate-900">
                            {{ selectedStock?.quantity ?? 0 }} {{ selectedStock?.unit || '' }}
                        </span>
                    </div>
                </div>

                <v-text-field v-model.number="adjustForm.quantityDelta" label="Quantity Delta" type="number"
                    variant="outlined" density="comfortable" hide-details="auto" placeholder="e.g. 10 or -5" />

                <div class="mt-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Use positive value to add stock, negative value to reduce stock.
                </div>
            </v-card-text>

            <v-card-actions class="border-t bg-slate-50 px-6 py-4">
                <v-spacer />

                <v-btn variant="text" class="text-slate-600" @click="adjustDialog = false">
                    Cancel
                </v-btn>

                <v-btn color="warning" variant="flat" min-width="130" @click="saveAdjust">
                    Apply Adjustment
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style scoped>
.pharmacy-dialog-shell {
    min-height: 100%;
}

.pharmacy-form-grid {
    align-items: start;
}
</style>
