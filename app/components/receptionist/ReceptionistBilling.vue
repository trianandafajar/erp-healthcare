<script setup lang="ts">
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
    <div class="d-flex justify-space-between align-center mb-6 flex-wrap ga-3">
        <div>
            <h2 class="text-h3 mb-1">Billing</h2>
            <p class="text-medium-emphasis mb-0">Manage patient invoices, payment status, and receipts.</p>
        </div>
        <div class="d-flex align-center ga-3">
            <v-btn color="primary" prepend-icon="mdi-plus" @click="createDialog = true">
                New Invoice
            </v-btn>
        </div>
    </div>
    <v-card elevation="0" class="px-4 py-3">
        <div class="text-caption text-medium-emphasis">Outstanding Billing</div>
        <div class="text-h5 font-weight-bold">{{ formatCurrency(totalPending) }}</div>
    </v-card>
    <UiTitleCard class-name="px-0 pb-0 rounded-md" title="Billing List">
        <div class="px-4 py-3 d-flex align-center justify-space-between flex-wrap ga-3">
            <v-text-field v-model="search" placeholder="Search invoice, patient, MRN, service, or department"
                prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable
                style="max-width: 430px" />
            <v-btn-toggle v-model="statusFilter" mandatory density="compact" variant="tonal" color="primary"
                class="flex-wrap">
                <v-btn value="All">All</v-btn>
                <v-btn value="Paid">Paid</v-btn>
                <v-btn value="Pending">Pending</v-btn>
                <v-btn value="Overdue">Overdue</v-btn>
            </v-btn-toggle>
        </div>

        <v-table class="text-no-wrap">
            <thead>
                <tr>
                    <th>Invoice</th>
                    <th>Patient</th>
                    <th>Service</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th class="text-right">Action</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in filteredBilling" :key="item.id">
                    <td>
                        <div class="font-weight-medium">{{ item.invoiceNumber }}</div>
                        <div class="text-caption text-medium-emphasis">
                            {{ new Date(item.serviceDate).toLocaleDateString('en-US', {
                                day: 'numeric', month: 'short',
                                year: 'numeric'
                            }) }}
                        </div>
                    </td>
                    <td>
                        <div class="font-weight-medium">{{ item.patientName }}</div>
                        <div class="text-caption text-medium-emphasis">{{ item.medicalRecordNumber }}</div>
                    </td>
                    <td>
                        <div>{{ item.serviceName }}</div>
                        <div class="text-caption text-medium-emphasis">{{ item.department }} - {{ item.paymentMethod }}
                        </div>
                    </td>
                    <td>{{ formatCurrency(item.amount) }}</td>
                    <td>
                        <v-chip size="small" variant="tonal" :color="statusColor(item.status)">
                            {{ item.status }}
                        </v-chip>
                    </td>
                    <td class="text-right">
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
                <tr v-if="filteredBilling.length === 0">
                    <td colspan="6" class="text-center py-6 text-medium-emphasis">No billing record found.</td>
                </tr>
            </tbody>
        </v-table>
    </UiTitleCard>
    <v-dialog v-model="createDialog" max-width="560">
        <v-card rounded="lg">
            <v-card-title class="text-h6 pa-6 pb-2">New Billing Invoice</v-card-title>
            <v-card-text class="d-flex flex-column ga-3">
                <v-select v-model="form.patientId" :items="patients" item-title="full_name" item-value="id"
                    label="Patient" />
                <v-text-field v-model="form.medicalRecordId" label="Medical Record ID" variant="outlined"
                    density="compact" />
                <v-text-field v-model="form.serviceName" label="Service Name" variant="outlined" density="compact" />
                <v-text-field v-model="form.department" label="Department" variant="outlined" density="compact" />
                <v-text-field v-model.number="form.amount" label="Amount" type="number" variant="outlined"
                    density="compact" prefix="$" />
                <v-select v-model="form.paymentMethod"
                    :items="['Cash', 'Credit Card', 'Debit Card', 'Insurance', 'Transfer']" label="Payment Method"
                    variant="outlined" density="compact" />
                <v-text-field v-model="form.serviceDate" label="Service Date" type="date" variant="outlined"
                    density="compact" />
            </v-card-text>
            <v-card-actions class="px-6 pb-4">
                <v-spacer />
                <v-btn variant="text" @click="createDialog = false">Cancel</v-btn>
                <v-btn color="primary" variant="flat" :loading="createLoading" @click="submitCreateBilling">
                    Create Invoice
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="2500">
        {{ snackbarMessage }}
    </v-snackbar>
</template>
