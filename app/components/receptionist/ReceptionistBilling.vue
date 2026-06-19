<script setup lang="ts">
const workspace = useReceptionistWorkspace()
const search = ref('')
const statusFilter = ref('All')
const snackbar = ref(false)
const snackbarMessage = ref('')

const filteredBilling = computed(() => {
    const keyword = search.value.toLowerCase()
    return workspace.billing.value.filter((item) => {
        const matchesStatus = statusFilter.value === 'All' || item.status === statusFilter.value
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
    workspace.billing.value
        .filter((item) => item.status === 'Pending' || item.status === 'Overdue')
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

function markPaid(id: string, invoiceNumber: string) {
    workspace.updateBillingStatus(id, 'Paid')
    snackbarMessage.value = `${invoiceNumber} marked as paid.`
    snackbar.value = true
}

function openReceipt(invoiceNumber: string) {
    snackbarMessage.value = `Receipt opened for ${invoiceNumber}.`
    snackbar.value = true
}
</script>

<template>
    <div class="d-flex justify-space-between align-center mb-6 flex-wrap ga-3">
        <div>
            <h2 class="text-h3 mb-1">Billing</h2>
            <p class="text-medium-emphasis mb-0">Manage patient invoices, payment status, and receipts from the reception desk.</p>
        </div>
        <v-card elevation="0" class="px-4 py-3">
            <div class="text-caption text-medium-emphasis">Outstanding Billing</div>
            <div class="text-h5 font-weight-bold">{{ formatCurrency(totalPending) }}</div>
        </v-card>
    </div>

    <UiTitleCard class-name="px-0 pb-0 rounded-md" title="Billing List">
        <div class="px-4 py-3 d-flex align-center justify-space-between flex-wrap ga-3">
            <v-text-field
                v-model="search"
                placeholder="Search invoice, patient, MRN, service, or department"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                style="max-width: 430px"
            />
            <v-btn-toggle v-model="statusFilter" mandatory density="compact" variant="tonal" color="primary" class="flex-wrap">
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
                            {{ new Date(item.serviceDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) }}
                        </div>
                    </td>
                    <td>
                        <div class="font-weight-medium">{{ item.patientName }}</div>
                        <div class="text-caption text-medium-emphasis">{{ item.medicalRecordNumber }}</div>
                    </td>
                    <td>
                        <div>{{ item.serviceName }}</div>
                        <div class="text-caption text-medium-emphasis">{{ item.department }} - {{ item.paymentMethod }}</div>
                    </td>
                    <td>{{ formatCurrency(item.amount) }}</td>
                    <td>
                        <v-chip size="small" variant="tonal" :color="statusColor(item.status)">
                            {{ item.status }}
                        </v-chip>
                    </td>
                    <td class="text-right">
                        <v-btn
                            v-if="item.status !== 'Paid'"
                            size="small"
                            color="primary"
                            variant="tonal"
                            prepend-icon="mdi-cash-check"
                            @click="markPaid(item.id, item.invoiceNumber)"
                        >
                            Mark Paid
                        </v-btn>
                        <v-btn
                            v-else
                            size="small"
                            color="success"
                            variant="text"
                            prepend-icon="mdi-receipt-text-outline"
                            @click="openReceipt(item.invoiceNumber)"
                        >
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

    <v-snackbar v-model="snackbar" color="success" timeout="2500">
        {{ snackbarMessage }}
    </v-snackbar>
</template>
