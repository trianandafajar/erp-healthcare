<script setup lang="ts">
import usePharmacyWorkspace from '~/composables/usePharmacyWorkspace'
import type { StockItem } from '~/data/pharmacy'

const workspace = usePharmacyWorkspace()
const search = ref('')
const stockFilter = ref<'all' | 'low'>('all')
const dialog = ref(false)
const mode = ref<'create' | 'edit'>('create')
const adjustDialog = ref(false)
const selectedId = ref<string | null>(null)

const form = reactive({
    medicineName: '',
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

const filteredStock = computed(() => {
    const keyword = search.value.trim().toLowerCase()

    return stockItems.value.filter((item) => {
        const matchFilter = stockFilter.value === 'all' || item.quantity <= item.minimumStock
        const matchKeyword =
            !keyword ||
            item.medicineName.toLowerCase().includes(keyword) ||
            item.supplier.toLowerCase().includes(keyword) ||
            item.batchNumber.toLowerCase().includes(keyword)

        return matchFilter && matchKeyword
    })
})

const selectedStock = computed(() =>
    stockItems.value.find((item) => item.id === selectedId.value) ?? null,
)

function resetForm() {
    form.medicineName = ''
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

function openEdit(item: StockItem) {
    mode.value = 'edit'
    selectedId.value = item.id
    form.medicineName = item.medicineName
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

function saveStock() {
    if (!form.medicineName.trim() || !form.supplier.trim() || !form.batchNumber.trim() || !form.expiredDate || !form.quantity) {
        return
    }

    workspace.upsertStockMedicine({
        id: selectedId.value ?? undefined,
        medicineName: form.medicineName.trim(),
        supplier: form.supplier.trim(),
        batchNumber: form.batchNumber.trim(),
        expiredDate: new Date(form.expiredDate).toISOString(),
        quantity: Number(form.quantity),
        minimumStock: Number(form.minimumStock),
        unit: form.unit.trim() || 'tablet',
    })
    dialog.value = false
}

function saveAdjust() {
    if (!selectedId.value) return
    workspace.adjustStock(selectedId.value, Number(adjustForm.quantityDelta))
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
            <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openCreate">
                Add Medicine
            </v-btn>
        </div>
    </v-card-item>

    <v-card elevation="0">
        <v-card-text class="d-flex flex-column ga-4">
            <v-row dense>
                <v-col cols="12" md="7">
                    <v-text-field
                        v-model="search"
                        label="Search medicine"
                        placeholder="Search medicine, supplier, or batch number"
                        prepend-inner-icon="mdi-magnify"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                        clearable
                    />
                </v-col>
                <v-col cols="12" md="5">
                    <v-select
                        v-model="stockFilter"
                        :items="[
                            { title: 'All stock', value: 'all' },
                            { title: 'Low stock only', value: 'low' },
                        ]"
                        item-title="title"
                        item-value="value"
                        label="Filter"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                    />
                </v-col>
            </v-row>

            <v-table hover density="comfortable">
                <thead class="bg-containerBg">
                    <tr>
                        <th class="text-left text-caption font-weight-bold text-uppercase">Medicine</th>
                        <th class="text-left text-caption font-weight-bold text-uppercase">Supplier / Batch</th>
                        <th class="text-left text-caption font-weight-bold text-uppercase">Expiry</th>
                        <th class="text-left text-caption font-weight-bold text-uppercase">Stock</th>
                        <th class="text-left text-caption font-weight-bold text-uppercase">Status</th>
                        <th class="text-right text-caption font-weight-bold text-uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="filteredStock.length === 0">
                        <td colspan="6" class="text-center py-8 text-medium-emphasis">
                            No medicines found
                        </td>
                    </tr>
                    <tr v-else v-for="item in filteredStock" :key="item.id">
                        <td class="py-3">
                            <div class="text-body-2 font-weight-medium">{{ item.medicineName }}</div>
                            <div class="text-caption text-medium-emphasis">{{ item.unit }}</div>
                        </td>
                        <td class="py-3">
                            <div class="text-body-2">{{ item.supplier }}</div>
                            <div class="text-caption text-medium-emphasis">{{ item.batchNumber }}</div>
                        </td>
                        <td class="py-3 text-body-2">{{ formatDate(item.expiredDate) }}</td>
                        <td class="py-3 text-body-2">{{ item.quantity }} {{ item.unit }}</td>
                        <td class="py-3">
                            <v-chip size="small" variant="tonal" :color="lowStockColor(item)">
                                {{ item.quantity <= item.minimumStock ? 'Low Stock' : 'Healthy' }}
                            </v-chip>
                        </td>
                        <td class="py-3 text-right">
                            <v-btn size="small" variant="text" color="secondary" @click="openEdit(item)">
                                Edit
                            </v-btn>
                            <v-btn size="small" variant="text" color="warning" @click="openAdjust(item)">
                                Adjust Stock
                            </v-btn>
                        </td>
                    </tr>
                </tbody>
            </v-table>
        </v-card-text>
    </v-card>

    <v-dialog v-model="dialog" max-width="700">
        <v-card>
            <v-card-title class="text-h6">
                {{ mode === 'create' ? 'Add Medicine' : 'Edit Medicine' }}
            </v-card-title>
            <v-card-text>
                <v-row dense>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.medicineName" label="Medicine" variant="outlined" density="comfortable" />
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.supplier" label="Supplier" variant="outlined" density="comfortable" />
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.batchNumber" label="Batch Number" variant="outlined" density="comfortable" />
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.expiredDate" label="Expired Date" type="date" variant="outlined" density="comfortable" />
                    </v-col>
                    <v-col cols="12" md="4">
                        <v-text-field v-model="form.quantity" label="Quantity" type="number" variant="outlined" density="comfortable" />
                    </v-col>
                    <v-col cols="12" md="4">
                        <v-text-field v-model="form.minimumStock" label="Minimum Stock" type="number" variant="outlined" density="comfortable" />
                    </v-col>
                    <v-col cols="12" md="4">
                        <v-text-field v-model="form.unit" label="Unit" variant="outlined" density="comfortable" />
                    </v-col>
                </v-row>
            </v-card-text>
            <v-card-actions class="justify-end">
                <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
                <v-btn color="primary" variant="flat" @click="saveStock">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="adjustDialog" max-width="520">
        <v-card>
            <v-card-title class="text-h6">Adjust Stock</v-card-title>
            <v-card-text>
                <v-alert type="info" variant="tonal" class="mb-4">
                    {{ selectedStock?.medicineName || 'Selected medicine' }}
                </v-alert>
                <v-text-field
                    v-model="adjustForm.quantityDelta"
                    label="Quantity Delta"
                    type="number"
                    variant="outlined"
                    density="comfortable"
                    helper-text="Use positive numbers for add, negative numbers for reduce."
                />
            </v-card-text>
            <v-card-actions class="justify-end">
                <v-btn variant="text" @click="adjustDialog = false">Cancel</v-btn>
                <v-btn color="warning" variant="flat" @click="saveAdjust">Apply</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
