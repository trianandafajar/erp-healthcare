<script setup lang="ts">
import usePharmacyWorkspace from '~/composables/usePharmacyWorkspace'
import type { StockReason, StockMovementItem, StockMovementType } from '~/data/pharmacy'

const props = defineProps<{
    type: StockMovementType
}>()

const workspace = usePharmacyWorkspace()
const dialog = ref(false)
const detailDialog = ref(false)
const mode = ref<'create' | 'edit'>('create')
const selectedId = ref<string | null>(null)

const movementReasons: { title: StockReason; value: StockReason }[] = [
    { title: 'Damaged', value: 'Damaged' },
    { title: 'Expired', value: 'Expired' },
    { title: 'Manual Adjustment', value: 'Manual Adjustment' },
    { title: 'Transfer', value: 'Transfer' },
]

const stockOptions = computed(() =>
    workspace.stocks.value.map((item) => ({
        title: item.medicineName,
        value: item.medicineName,
    })),
)

const movements = computed(() => workspace.movements.value.filter((item) => item.type === props.type))
const selectedMovement = computed(() => movements.value.find((item) => item.id === selectedId.value) ?? null)

const incomingForm = reactive({
    medicineName: '',
    supplier: '',
    batchNumber: '',
    expiredDate: '',
    quantity: 0,
    note: '',
})

const outgoingForm = reactive({
    medicineName: '',
    reason: 'Damaged' as StockReason,
    quantity: 0,
    note: '',
})

function resetForm() {
    incomingForm.medicineName = ''
    incomingForm.supplier = ''
    incomingForm.batchNumber = ''
    incomingForm.expiredDate = ''
    incomingForm.quantity = 0
    incomingForm.note = ''

    outgoingForm.medicineName = ''
    outgoingForm.reason = 'Damaged'
    outgoingForm.quantity = 0
    outgoingForm.note = ''
}

function openCreate() {
    mode.value = 'create'
    selectedId.value = null
    resetForm()
    dialog.value = true
}

function openEdit(item: StockMovementItem) {
    mode.value = 'edit'
    selectedId.value = item.id

    if (props.type === 'Incoming') {
        incomingForm.medicineName = item.medicineName
        incomingForm.supplier = item.reasonOrSupplier
        incomingForm.batchNumber = item.batchNumber
        incomingForm.expiredDate = item.expiredDate.slice(0, 10)
        incomingForm.quantity = item.quantity
        incomingForm.note = item.note
    } else {
        outgoingForm.medicineName = item.medicineName
        outgoingForm.reason = item.reasonOrSupplier as StockReason
        outgoingForm.quantity = item.quantity
        outgoingForm.note = item.note
    }

    dialog.value = true
}

function openDetail(item: StockMovementItem) {
    selectedId.value = item.id
    detailDialog.value = true
}

function deleteMovement(id: string) {
    workspace.movements.value = workspace.movements.value.filter((item) => item.id !== id)
}

function saveMovement() {
    if (props.type === 'Incoming') {
        if (!incomingForm.medicineName.trim() || !incomingForm.supplier.trim() || !incomingForm.batchNumber.trim() || !incomingForm.expiredDate || !incomingForm.quantity) return

        if (mode.value === 'create') {
            workspace.addIncomingStock({
                medicineName: incomingForm.medicineName.trim(),
                supplier: incomingForm.supplier.trim(),
                batchNumber: incomingForm.batchNumber.trim(),
                expiredDate: new Date(incomingForm.expiredDate).toISOString(),
                quantity: Number(incomingForm.quantity),
                note: incomingForm.note.trim(),
            })
        } else if (selectedId.value) {
            workspace.movements.value = workspace.movements.value.map((item) => (
                item.id === selectedId.value
                    ? {
                        ...item,
                        medicineName: incomingForm.medicineName.trim(),
                        reasonOrSupplier: incomingForm.supplier.trim(),
                        batchNumber: incomingForm.batchNumber.trim(),
                        expiredDate: new Date(incomingForm.expiredDate).toISOString(),
                        quantity: Number(incomingForm.quantity),
                        note: incomingForm.note.trim(),
                    }
                    : item
            ))
        }
    } else {
        if (!outgoingForm.medicineName.trim() || !outgoingForm.quantity) return

        if (mode.value === 'create') {
            workspace.addOutgoingStock({
                medicineName: outgoingForm.medicineName.trim(),
                reason: outgoingForm.reason,
                quantity: Number(outgoingForm.quantity),
                note: outgoingForm.note.trim(),
            })
        } else if (selectedId.value) {
            workspace.movements.value = workspace.movements.value.map((item) => (
                item.id === selectedId.value
                    ? {
                        ...item,
                        medicineName: outgoingForm.medicineName.trim(),
                        reasonOrSupplier: outgoingForm.reason,
                        quantity: Number(outgoingForm.quantity),
                        note: outgoingForm.note.trim(),
                    }
                    : item
            ))
        }
    }

    dialog.value = false
}

function formatDateTime(value: string) {
    return new Date(value).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })
}

function pageTitle() {
    return props.type === 'Incoming' ? 'Stock In' : 'Stock Out'
}

function pageSubtitle() {
    return props.type === 'Incoming'
        ? 'Record incoming medicines and manage inventory receipts.'
        : 'Track outgoing medicines for adjustment or transfer.'
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex flex-wrap align-center justify-space-between ga-3">
            <div>
                <div class="text-caption text-uppercase text-medium-emphasis">Pharmacy Inventory</div>
                <v-card-title class="text-h4">{{ pageTitle() }}</v-card-title>
                <v-card-subtitle class="mt-1">
                    {{ pageSubtitle() }}
                </v-card-subtitle>
            </div>
            <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openCreate">
                Add {{ props.type === 'Incoming' ? 'Incoming' : 'Outgoing' }}
            </v-btn>
        </div>
    </v-card-item>

    <v-card elevation="0">
        <v-card-text class="d-flex flex-column ga-4">
            <v-table hover density="comfortable">
                <thead class="bg-containerBg">
                    <tr>
                        <th class="text-left text-caption font-weight-bold text-uppercase">Medicine</th>
                        <th class="text-left text-caption font-weight-bold text-uppercase">
                            {{ props.type === 'Incoming' ? 'Supplier / Batch' : 'Reason' }}
                        </th>
                        <th class="text-left text-caption font-weight-bold text-uppercase">
                            {{ props.type === 'Incoming' ? 'Expiry' : 'Quantity' }}
                        </th>
                        <th class="text-left text-caption font-weight-bold text-uppercase">Note</th>
                        <th class="text-left text-caption font-weight-bold text-uppercase">Date</th>
                        <th class="text-right text-caption font-weight-bold text-uppercase movement-actions-head">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="movements.length === 0">
                        <td colspan="6" class="text-center py-8 text-medium-emphasis">
                            No movements found
                        </td>
                    </tr>
                    <tr v-else v-for="movement in movements" :key="movement.id">
                        <td class="py-3">
                            <div class="text-body-2 font-weight-medium">{{ movement.medicineName }}</div>
                            <div class="text-caption text-medium-emphasis">Reference: {{ movement.reference }}</div>
                        </td>
                        <td class="py-3">
                            <div class="text-body-2">
                                {{ props.type === 'Incoming' ? movement.reasonOrSupplier : movement.reasonOrSupplier }}
                            </div>
                            <div class="text-caption text-medium-emphasis" v-if="props.type === 'Incoming'">
                                Batch: {{ movement.batchNumber }}
                            </div>
                        </td>
                        <td class="py-3 text-body-2">
                            <template v-if="props.type === 'Incoming'">
                                {{ formatDateTime(movement.expiredDate) }}
                            </template>
                            <template v-else>
                                {{ movement.quantity }}
                            </template>
                        </td>
                        <td class="py-3 text-body-2">{{ movement.note }}</td>
                        <td class="py-3 text-body-2 text-medium-emphasis">{{ formatDateTime(movement.createdAt) }}</td>
                        <td class="py-3 text-right movement-actions-cell">
                            <div class="movement-action-group">
                                <v-btn size="small" variant="text" color="secondary" @click="openDetail(movement)">
                                    View Detail
                                </v-btn>
                                <v-btn size="small" variant="text" color="primary" @click="openEdit(movement)">
                                    Edit
                                </v-btn>
                                <v-btn size="small" variant="text" color="error" @click="deleteMovement(movement.id)">
                                    Delete
                                </v-btn>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </v-table>
        </v-card-text>
    </v-card>

    <v-dialog v-model="dialog" max-width="700">
        <v-card>
            <v-card-title class="text-h6">
                {{ mode === 'create' ? `Add ${props.type === 'Incoming' ? 'Incoming' : 'Outgoing'} Stock` : `Edit ${pageTitle()}` }}
            </v-card-title>
            <v-card-text>
                <v-form class="d-flex flex-column ga-4" @submit.prevent="saveMovement">
                    <template v-if="props.type === 'Incoming'">
                        <v-autocomplete
                            v-model="incomingForm.medicineName"
                            :items="stockOptions"
                            item-title="title"
                            item-value="value"
                            label="Medicine"
                            placeholder="Search medicine..."
                            variant="outlined"
                            density="comfortable"
                            hide-details
                            clearable
                        />
                        <v-text-field v-model="incomingForm.supplier" label="Supplier" variant="outlined" density="comfortable" />
                        <v-text-field v-model="incomingForm.batchNumber" label="Batch Number" variant="outlined" density="comfortable" />
                        <v-text-field v-model="incomingForm.expiredDate" label="Expired Date" type="date" variant="outlined" density="comfortable" />
                        <v-text-field v-model="incomingForm.quantity" label="Quantity" type="number" variant="outlined" density="comfortable" />
                        <v-textarea v-model="incomingForm.note" label="Note" rows="3" variant="outlined" density="comfortable" />
                    </template>

                    <template v-else>
                        <v-autocomplete
                            v-model="outgoingForm.medicineName"
                            :items="stockOptions"
                            item-title="title"
                            item-value="value"
                            label="Medicine"
                            placeholder="Search medicine..."
                            variant="outlined"
                            density="comfortable"
                            hide-details
                            clearable
                        />
                        <v-select
                            v-model="outgoingForm.reason"
                            :items="movementReasons"
                            item-title="title"
                            item-value="value"
                            label="Reason"
                            variant="outlined"
                            density="comfortable"
                        />
                        <v-text-field v-model="outgoingForm.quantity" label="Quantity" type="number" variant="outlined" density="comfortable" />
                        <v-textarea v-model="outgoingForm.note" label="Note" rows="3" variant="outlined" density="comfortable" />
                    </template>

                    <div class="d-flex justify-end ga-2">
                        <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
                        <v-btn type="submit" color="primary" variant="flat">
                            Save
                        </v-btn>
                    </div>
                </v-form>
            </v-card-text>
        </v-card>
    </v-dialog>

    <v-dialog v-model="detailDialog" max-width="620">
        <v-card v-if="selectedMovement">
            <v-card-title class="text-h6">Movement Detail</v-card-title>
            <v-card-text>
                <v-row dense>
                    <v-col cols="12" md="6">
                        <div class="text-caption text-medium-emphasis">Medicine</div>
                        <div class="text-body-1 font-weight-medium">{{ selectedMovement.medicineName }}</div>
                    </v-col>
                    <v-col cols="12" md="6">
                        <div class="text-caption text-medium-emphasis">Reference</div>
                        <div class="text-body-1 font-weight-medium">{{ selectedMovement.reference }}</div>
                    </v-col>
                    <v-col cols="12" md="6">
                        <div class="text-caption text-medium-emphasis">{{ props.type === 'Incoming' ? 'Supplier' : 'Reason' }}</div>
                        <div class="text-body-2">{{ selectedMovement.reasonOrSupplier }}</div>
                    </v-col>
                    <v-col cols="12" md="6">
                        <div class="text-caption text-medium-emphasis">Quantity</div>
                        <div class="text-body-2">{{ selectedMovement.quantity }}</div>
                    </v-col>
                    <v-col cols="12">
                        <div class="text-caption text-medium-emphasis">Note</div>
                        <div class="text-body-2">{{ selectedMovement.note }}</div>
                    </v-col>
                    <v-col cols="12">
                        <div class="text-caption text-medium-emphasis">Date</div>
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
.movement-actions-head {
    width: 260px;
}

.movement-actions-cell {
    min-width: 260px;
}

.movement-action-group {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
    flex-wrap: nowrap;
    white-space: nowrap;
}

@media (max-width: 960px) {
    .movement-actions-head,
    .movement-actions-cell {
        width: auto;
        min-width: 0;
    }

    .movement-action-group {
        flex-wrap: wrap;
    }
}
</style>
