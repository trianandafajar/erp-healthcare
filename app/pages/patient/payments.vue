<script setup lang="ts">
definePageMeta({
    layout: 'patient',
    middleware: 'auth'
})

useSeoMeta({
    title: 'Payments',
    description: 'Patient payments page',
})

const { payments } = usePatientPortalMock()
const snackbar = ref(false)
const snackbarMessage = ref('')
const search = ref('')
const statusFilter = ref('all')

const filteredPayments = computed(() =>
    payments.filter((item) => {
        const keyword = search.value.toLowerCase()
        const matchSearch =
            item.invoiceNumber.toLowerCase().includes(keyword) ||
            item.serviceName.toLowerCase().includes(keyword)
        const matchStatus = statusFilter.value === 'all' || item.status === statusFilter.value
        return matchSearch && matchStatus
    })
)

function statusColor(status: string) {
    return ({
        Paid: 'success',
        Pending: 'warning',
        Overdue: 'error'
    } as Record<string, string>)[status] ?? 'secondary'
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2
    }).format(amount)
}

function handleAction(item: { invoiceNumber: string; status: string }) {
    snackbarMessage.value = item.status === 'Paid'
        ? `Receipt opened for ${item.invoiceNumber}`
        : `Payment flow prepared for ${item.invoiceNumber}`
    snackbar.value = true
}
</script>

<template>
    <div class="d-flex justify-space-between align-center mb-6 flex-wrap ga-3">
        <div>
            <h2 class="text-h3 mb-1">Payments</h2>
            <p class="text-medium-emphasis mb-0">Track your invoices, billing status, and payment actions.</p>
        </div>
    </div>

    <UiTitleCard class-name="px-0 pb-0 rounded-md" title="Billing Overview">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 px-4 py-3">
            <v-text-field v-model="search" placeholder="Search invoice or service name"
                prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable
                style="max-width: 340px" />
            <v-btn-toggle v-model="statusFilter" mandatory density="compact" variant="tonal" color="primary"
                class="flex-wrap">
                <v-btn value="all">All</v-btn>
                <v-btn value="Paid">Paid</v-btn>
                <v-btn value="Pending">Pending</v-btn>
                <v-btn value="Overdue">Overdue</v-btn>
            </v-btn-toggle>
        </div>
        <v-table class="text-no-wrap">
            <thead>
                <tr>
                    <th>Invoice Number</th>
                    <th>Service Date</th>
                    <th>Service Name</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th class="text-right">Action</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in filteredPayments" :key="item.id">
                    <td>{{ item.invoiceNumber }}</td>
                    <td>{{ new Date(item.serviceDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) }}</td>
                    <td>{{ item.serviceName }}</td>
                    <td>{{ formatCurrency(item.amount) }}</td>
                    <td>
                        <v-chip size="small" :color="statusColor(item.status)" variant="tonal">{{ item.status }}</v-chip>
                    </td>
                    <td class="text-right">
                        <v-btn size="small" variant="text" color="primary"
                            :prepend-icon="item.status === 'Paid' ? 'mdi-receipt-text-outline' : 'mdi-credit-card-outline'"
                            @click="handleAction(item)">
                            {{ item.status === 'Paid' ? 'View Receipt' : 'Pay Now' }}
                        </v-btn>
                    </td>
                </tr>
                <tr v-if="filteredPayments.length === 0">
                    <td colspan="6" class="text-center py-6 text-medium-emphasis">No payment record found.</td>
                </tr>
            </tbody>
        </v-table>
    </UiTitleCard>

    <v-snackbar v-model="snackbar" color="success">
        {{ snackbarMessage }}
    </v-snackbar>
</template>
