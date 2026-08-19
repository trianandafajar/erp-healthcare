<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue';

const { getSignal } = useAbortController()

const { billing, updateBillingStatus, createBilling } = useBilling()

const createDialog = useState('billing-create-dialog', () => false)
const createLoading = ref(false)

const form = ref({
    patientId: '',
    medicalRecordId: '',
    serviceName: '',
    department: '',
    amount: 0,
    paymentMethod: 'Cash',
    serviceDate: new Date().toISOString().slice(0, 10),
})

const { can } = usePermission()

const search = ref('')
const statusFilter = ref('All')

const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref<'success' | 'error'>('success')

const { data: patientsData, status } = useFetch<{ patients: any[] }>('/api/patients')
const patients = computed(() => patientsData.value?.patients ?? [])

const { data: departmentsData } = useFetch<{ departments: any[] }>('/api/departments')
const departments = computed(() => departmentsData.value?.departments ?? [])

const medicalRecords = ref<{ id: string; diagnosis: string; date: string }[]>([])

watch(
    () => form.value.patientId,
    async (patientId) => {
        if (!patientId) {
            medicalRecords.value = []
            form.value.medicalRecordId = ''
            return
        }
        try {
            const res = await $fetch<{ medicalRecords: any[] }>(
                `/api/patients/${patientId}/medical-records`,
                { signal: getSignal() }
            )
            medicalRecords.value = res.medicalRecords ?? []
            if (medicalRecords.value.length === 1) {
                const firstRecord = medicalRecords.value[0]
                form.value.medicalRecordId = firstRecord?.id ?? ''
            } else {
                form.value.medicalRecordId = ''
            }
        } catch {
            medicalRecords.value = []
        }
    },
    { immediate: false }
)

const medicalRecordOptions = computed(() =>
    medicalRecords.value.map((mr) => ({
        title: `${mr.diagnosis} — ${new Date(mr.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`,
        id: mr.id,
    }))
)

async function submitCreateBilling() {
    createLoading.value = true

    try {
        await createBilling(form.value)

        snackbarMessage.value = 'Billing created successfully.'
        snackbarColor.value = 'success'
        snackbar.value = true

        createDialog.value = false

        form.value = {
            patientId: '',
            medicalRecordId: '',
            serviceName: '',
            department: '',
            amount: 0,
            paymentMethod: 'Cash',
            serviceDate: new Date().toISOString().slice(0, 10),
        }
    } catch (e: any) {
        snackbarMessage.value =
            e?.data?.message ?? 'Failed to create billing.'

        snackbarColor.value = 'error'
        snackbar.value = true
    } finally {
        createLoading.value = false
    }
}

const filteredBilling = computed(() => {
    const keyword = search.value.toLowerCase()

    return billing.value.filter((item) => {
        const matchesStatus =
            statusFilter.value === 'All' ||
            item.status === statusFilter.value

        const matchesKeyword =
            item.invoiceNumber.toLowerCase().includes(keyword) ||
            item.patientName.toLowerCase().includes(keyword) ||
            item.medicalRecordNumber.toLowerCase().includes(keyword) ||
            item.serviceName.toLowerCase().includes(keyword) ||
            item.department.toLowerCase().includes(keyword)

        return matchesStatus && matchesKeyword
    })
})

const totalPending = computed(() =>
    billing.value
        .filter(
            (item) =>
                item.status === 'Pending' ||
                item.status === 'Overdue'
        )
        .reduce((total, item) => total + item.amount, 0)
)

function statusColor(status: string) {
    if (status === 'Paid') return 'success'
    if (status === 'Overdue') return 'error'
    return 'warning'
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
    }).format(amount)
}

async function markPaid(id: string, invoiceNumber: string) {
    try {
        await updateBillingStatus(id, 'Paid')

        snackbarMessage.value = `${invoiceNumber} marked as paid.`
        snackbarColor.value = 'success'
        snackbar.value = true
    } catch {
        snackbarMessage.value = 'Failed to update billing status.'
        snackbarColor.value = 'error'
        snackbar.value = true
    }
}

function openReceipt(invoiceNumber: string) {
    snackbarMessage.value = `Receipt opened for ${invoiceNumber}.`
    snackbarColor.value = 'success'
    snackbar.value = true
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex justify-space-between align-center">
            <div>
                <v-card-title class="text-h3">Billing</v-card-title>
                <v-card-subtitle class="mt-1">Manage patient invoices, payment status, and receipts.</v-card-subtitle>
            </div>
            <v-btn color="primary" variant="flat" size="large" prepend-icon="mdi-plus" density="comfortable"
                @click="createDialog = true">
                New Invoice
            </v-btn>
        </div>
    </v-card-item>

    <v-card elevation="0" class="px-4 py-3 mb-4">
        <div class="text-caption text-medium-emphasis">Outstanding Billing</div>
        <div class="text-h5 font-weight-bold">{{ formatCurrency(totalPending) }}</div>
    </v-card>

    <UiTitleCard class-name="px-0 pb-0 rounded-md">
        <div class="d-flex align-center justify-space-between gap-3 px-4 py-3 flex-wrap">
            <v-text-field v-model="search" placeholder="Search invoice, patient, MRN, service, or department"
                prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable
                style="max-width: 320px" />
            <v-btn-toggle v-model="statusFilter" mandatory density="compact" variant="tonal" color="primary"
                class="flex-wrap">
                <v-btn value="All" size="small">All</v-btn>
                <v-btn value="Paid" size="small">Paid</v-btn>
                <v-btn value="Pending" size="small">Pending</v-btn>
                <v-btn value="Overdue" size="small">Overdue</v-btn>
            </v-btn-toggle>
        </div>

        <v-divider />

        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Invoice</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Patient</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Service</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Amount</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Status</th>
                    <th class="text-no-wrap text-right text-caption font-weight-bold text-uppercase">Action</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="filteredBilling.length === 0">
                    <td colspan="6" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-receipt-text-outline" size="32" class="mb-2 d-block mx-auto" />
                        No billing records found
                    </td>
                </tr>
                <tr v-else v-for="item in filteredBilling" :key="item.id">
                    <td class="py-3">
                        <span class="text-body-2 font-weight-medium d-block">{{ item.invoiceNumber }}</span>
                        <span class="text-caption text-medium-emphasis">
                            {{ new Date(item.serviceDate).toLocaleDateString('en-US', {
                                day: 'numeric', month: 'short',
                                year: 'numeric'
                            }) }}
                        </span>
                    </td>
                    <td class="py-3">
                        <span class="text-body-2 font-weight-medium d-block">{{ item.patientName }}</span>
                        <span class="text-caption text-medium-emphasis">{{ item.medicalRecordNumber }}</span>
                    </td>
                    <td class="py-3 text-body-2 text-medium-emphasis">
                        <span class="d-block">{{ item.serviceName }}</span>
                        <span class="text-caption">{{ item.department }} - {{ item.paymentMethod }}</span>
                    </td>
                    <td class="py-3 text-body-2 font-weight-medium">{{ formatCurrency(item.amount) }}</td>
                    <td class="py-3">
                        <v-chip size="small" variant="tonal" :color="statusColor(item.status)" label>
                            {{ item.status }}
                        </v-chip>
                    </td>
                    <td class="py-3 text-right">
                        <v-btn v-if="can('billing.pay') && item.status !== 'Paid'" size="small" color="primary"
                            variant="tonal" prepend-icon="mdi-cash-check"
                            @click="markPaid(item.id, item.invoiceNumber)">
                            Mark Paid
                        </v-btn>
                        <v-btn v-else size="small" color="success" variant="text"
                            prepend-icon="mdi-receipt-text-outline" @click="openReceipt(item.invoiceNumber)">
                            Receipt
                        </v-btn>
                    </td>
                </tr>
            </tbody>
        </v-table>

        <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
                Showing {{ filteredBilling.length }} of {{ billing.length }} invoices
            </span>
        </div>
    </UiTitleCard>

    <v-dialog v-model="createDialog" max-width="560">
        <v-card rounded="lg">
            <v-card-title class="text-h6 pa-6 pb-2">New Billing Invoice</v-card-title>
            <v-card-text class="d-flex flex-column ga-3">
                <v-select v-model="form.patientId" :items="patients" item-title="full_name" item-value="id"
                    label="Patient" variant="outlined" density="compact" />
                <v-select v-model="form.medicalRecordId" :items="medicalRecordOptions" item-title="title"
                    item-value="id" label="Medical Record" variant="outlined" density="compact"
                    :disabled="!form.patientId" :loading="medicalRecords.length === 0 && !!form.patientId"
                    no-data-text="No medical records found for this patient" />
                <v-text-field v-model="form.serviceName" label="Service Name" variant="outlined" density="compact" />
                <v-select v-model="form.department" :items="departments" item-title="name" item-value="name"
                    label="Department" variant="outlined" density="compact" />
                <v-text-field v-model.number="form.amount" label="Amount" type="number" variant="outlined"
                    density="compact" prefix="$" min="0" :rules="[v => v >= 0 || 'Amount must be non-negative']"
                    @keydown="e => { if (e.key === '-') e.preventDefault() }" />
                <v-select v-model="form.paymentMethod"
                    :items="['Cash', 'Credit Card', 'Debit Card', 'Insurance', 'Transfer']" label="Payment Method"
                    variant="outlined" density="compact" />
                <v-text-field v-model="form.serviceDate" label="Service Date" type="date" variant="outlined"
                    density="compact" />
            </v-card-text>
            <v-card-actions class="px-6 pb-4">
                <v-spacer />
                <v-btn variant="text" @click="createDialog = false">Cancel</v-btn>
                <v-btn color="primary" variant="flat" :loading="createLoading" :disable="createLoading"
                    :style="createLoading ? 'cursor: not-allowed; pointer-events: auto;' : ''"
                    @click="submitCreateBilling">
                    Create Invoice
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" timeout="3000">
        {{ snackbarMessage }}
        <template #actions>
            <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
        </template>
    </v-snackbar>
</template>