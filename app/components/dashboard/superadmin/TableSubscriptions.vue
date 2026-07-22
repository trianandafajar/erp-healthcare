<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { refDebounced } from '@vueuse/core'
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue'
import SubscriptionModal from './SubscriptionModal.vue'
import { useRuntimeConfig } from 'nuxt/app'

interface Subscription {
    id: string
    tenant_id: string
    tenant: { name: string; slug: string; owner_id: string | null } | null
    plan: string
    status: string
    billing_cycle: string | null
    amount: number
    currency: string
    start_date: string
    next_billing: string | null
    trial_ends: string | null
    payment_method: string | null
    created_by: string | null
    created_at: string
    updated_at: string | null
}

interface TenantOption {
    id: string
    name: string
    slug: string
}

const tenants = ref<TenantOption[]>([])
const loading = ref(false)

const search = ref('')
const debouncedSearch = refDebounced(search, 400)
const planFilter = ref('All Plan')
const statusFilter = ref('All Status')
const currentPage = ref(1)
const itemsPerPage = 10

const planOptions = ['All Plan', 'Starter', 'Basic', 'Professional', 'Enterprise']
const statusOptions = ['All Status', 'active', 'suspended', 'trial', 'cancelled']

const queryParams = computed(() => ({
    page: currentPage.value,
    limit: itemsPerPage,
    search: debouncedSearch.value || undefined,
    plan: planFilter.value !== 'All Plan' ? planFilter.value.toLowerCase() : undefined,
    status: statusFilter.value !== 'All Status' ? statusFilter.value : undefined,
}))

const { data, pending, refresh } = await useFetch<{
    subscriptions: Subscription[]
    total: number
    totalPages: number
}>('/api/superadmin/subscriptions', { query: queryParams })

const subscriptions = computed(() => data.value?.subscriptions ?? [])
const totalPages = computed(() => data.value?.totalPages ?? 1)
const totalSubscriptions = computed(() => data.value?.total ?? 0)

watch([debouncedSearch, planFilter, statusFilter], () => {
    currentPage.value = 1
})

async function fetchTenants() {
    try {
        const data = await $fetch<{ tenants: { id: string; name: string; slug: string }[] }>('/api/superadmin/tenants')
        tenants.value = data?.tenants ?? []
    } catch {
        tenants.value = []
    }
}

const planColors: Record<string, string> = {
    Free: 'grey',
    Basic: 'primary',
    Pro: 'warning',
    Enterprise: 'error',
}

const statusColors: Record<string, string> = {
    active: 'success',
    suspended: 'error',
    trial: 'info',
    cancelled: 'secondary',
}

const cycleIcons: Record<string, string> = {
    monthly: 'mdi-calendar-month-outline',
    yearly: 'mdi-calendar-star-outline',
}

function getPlanColor(plan: string) {
    return planColors[plan] ?? 'secondary'
}

function getStatusColor(status: string) {
    return statusColors[status] ?? 'secondary'
}

function formatCurrency(amount: number) {
    return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 0 })
}

function formatDate(dateStr: string | null) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
}

const dialog = ref(false)
const modalMode = ref<'add' | 'edit' | 'delete'>('add')
const selectedSubscription = ref<Subscription | null>(null)
const modalLoading = ref(false)

function openAdd() {
    modalMode.value = 'add'
    selectedSubscription.value = null
    dialog.value = true
}

function openEdit(sub: Subscription) {
    modalMode.value = 'edit'
    selectedSubscription.value = sub
    dialog.value = true
}

function openDelete(sub: Subscription) {
    modalMode.value = 'delete'
    selectedSubscription.value = sub
    dialog.value = true
}

function closeModal() {
    dialog.value = false
    selectedSubscription.value = null
}

const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('success')

function notify(msg: string, color = 'success') {
    snackbarMsg.value = msg
    snackbarColor.value = color
    snackbar.value = true
}

const allSubscriptions = ref<Subscription[]>([])

async function fetchAllSubscriptions() {
    try {
        const res = await $fetch<{ subscriptions: Subscription[] }>('/api/superadmin/subscriptions')
        allSubscriptions.value = res?.subscriptions ?? []
    } catch {
        allSubscriptions.value = []
    }
}

const availableTenants = computed(() => {
    const subscribedIds = new Set(allSubscriptions.value.map((s) => s.tenant_id))
    return tenants.value.filter(
        (t) => !subscribedIds.has(t.id) || modalMode.value === 'edit',
    )
})

async function handleSubmit(payload: any) {
    modalLoading.value = true
    try {
        if (modalMode.value === 'add') {
            await $fetch('/api/superadmin/subscriptions', {
                method: 'POST',
                body: {
                    tenant_id: payload.tenant_id,
                    plan: payload.plan,
                    status: payload.status,
                    billing_cycle: payload.billing_cycle,
                    amount: payload.amount,
                    start_date: payload.start_date,
                    payment_method: payload.payment_method || null,
                },
            })
            notify(`Subscription created`)
        } else if (modalMode.value === 'edit' && selectedSubscription.value) {
            await $fetch(`/api/superadmin/subscriptions/${selectedSubscription.value.id}`, {
                method: 'PUT',
                body: {
                    plan: payload.plan,
                    status: payload.status,
                    billing_cycle: payload.billing_cycle,
                    amount: payload.amount,
                    start_date: payload.start_date,
                    payment_method: payload.payment_method || null,
                },
            })
            notify(`Subscription updated`)
        } else if (modalMode.value === 'delete' && selectedSubscription.value) {
            await $fetch(`/api/superadmin/subscriptions/${selectedSubscription.value.id}`, {
                method: 'DELETE',
            })
            notify(`Subscription removed`)
        }
        closeModal()
        refresh()
        fetchAllSubscriptions()
    } catch (e: any) {
        notify(e?.message ?? 'Operation failed', 'error')
    } finally {
        modalLoading.value = false
    }
}

function getStatusLabel(status: string) {
    return status.charAt(0).toUpperCase() + status.slice(1)
}

function getAmountLabel(sub: Subscription) {
    if (sub.amount === 0) return 'Free'
    const cycle = sub.billing_cycle === 'yearly' ? '/yr' : '/mo'
    return formatCurrency(sub.amount) + cycle
}

function daysUntil(dateStr: string | null): number | null {
    if (!dateStr) return null
    const diff = new Date(dateStr).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function trialDaysLeft(sub: Subscription): number | null {
    if (sub.status !== 'trial' || !sub.trial_ends) return null
    return daysUntil(sub.trial_ends)
}

function mapToModalPayload(sub: Subscription | null) {
    if (!sub) return null
    return {
        id: sub.id,
        tenant_id: sub.tenant_id,
        tenant_name: sub.tenant?.name ?? '',
        tenant_slug: sub.tenant?.slug ?? '',
        plan: sub.plan,
        status: sub.status,
        billing_cycle: sub.billing_cycle ?? 'monthly',
        amount: sub.amount,
        start_date: sub.start_date,
        next_billing: sub.next_billing ?? '',
        trial_ends: sub.trial_ends ?? null,
        payment_method: sub.payment_method ?? '',
    }
}

onMounted(() => {
    fetchTenants()
    fetchAllSubscriptions()
})
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex justify-space-between align-center">
            <div>
                <v-card-title class="text-h3">Subscriptions Management</v-card-title>
                <v-card-subtitle class="mt-1">Manage subscription plans and tenant assignments</v-card-subtitle>
            </div>
            <v-btn color="primary" variant="flat" size="large" prepend-icon="mdi-plus" density="comfortable"
                @click="openAdd">
                Add Subscription
            </v-btn>
        </div>
    </v-card-item>

    <UiTitleCard class-name="px-0 pb-0 rounded-md">
        <div class="d-flex align-center justify-space-between gap-3 px-4 py-3 flex-wrap">
            <div class="d-flex align-center flex-grow-1" style="min-width: 220px; max-width: 400px">
                <v-text-field v-model="search" placeholder="Search by tenant or payment..."
                    prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable />
            </div>

            <div class="d-flex align-center ga-3">
                <v-select v-model="planFilter" :items="planOptions" variant="outlined" density="compact" hide-details
                    style="max-width: 250px" />
                <v-select v-model="statusFilter" :items="statusOptions" variant="outlined" density="compact" hide-details
                    style="max-width: 250px" />
            </div>
        </div>

        <v-divider />

        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Tenant</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Plan</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Amount</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Cycle</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Status</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Next Billing</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Payment</th>
                    <th class="text-no-wrap text-right text-caption font-weight-bold text-uppercase">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending && !data" v-for="i in 5" :key="i">
                    <td colspan="8" style="border-bottom: none;">
                        <v-skeleton-loader type="table-row" class="my-1" />
                    </td>
                </tr>
                <tr v-else-if="subscriptions.length === 0 && data">
                    <td colspan="8" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-credit-card-off-outline" size="36" class="mb-2 d-block mx-auto" />
                        <div class="text-body-1 font-weight-medium mb-1">No subscriptions found</div>
                        <div class="text-caption">
                            Try adjusting your search or filter criteria.
                        </div>
                    </td>
                </tr>
                <tr v-else v-for="sub in subscriptions" :key="sub.id">
                    <td class="py-3">
                        <div class="d-flex align-center ga-3">
                            <v-avatar size="34" color="primary" variant="tonal">
                                <span class="text-caption font-weight-bold">{{ getInitials(sub.tenant?.name ?? sub.tenant_id) }}</span>
                            </v-avatar>
                            <div>
                                <div class="text-body-2 font-weight-medium">{{ sub.tenant?.name ?? 'Unknown' }}</div>
                                <div class="text-caption text-medium-emphasis">{{ sub.tenant?.slug ?? '—' }}</div>
                            </div>
                        </div>
                    </td>
                    <td class="py-3">
                        <v-chip :color="getPlanColor(sub.plan)" variant="tonal" size="small">
                            {{ sub.plan }}
                        </v-chip>
                    </td>
                    <td class="py-3">
                        <span class="text-body-2 font-weight-medium">{{ getAmountLabel(sub) }}</span>
                    </td>
                    <td class="py-3">
                        <div class="d-flex align-center ga-1">
                            <v-icon v-if="sub.billing_cycle" :icon="cycleIcons[sub.billing_cycle]" size="16"
                                class="text-medium-emphasis" />
                            <span v-if="sub.billing_cycle" class="text-caption text-medium-emphasis text-capitalize">{{
                                sub.billing_cycle }}</span>
                            <span v-else class="text-caption text-disabled">—</span>
                        </div>
                    </td>
                    <td class="py-3">
                        <div class="d-flex align-center ga-2">
                            <v-chip :color="getStatusColor(sub.status)" variant="tonal" size="x-small">
                                {{ getStatusLabel(sub.status) }}
                            </v-chip>
                            <v-chip v-if="sub.status === 'trial' && trialDaysLeft(sub) !== null && trialDaysLeft(sub)! > 0"
                                color="info" variant="flat" size="x-small">
                                {{ trialDaysLeft(sub) }}d left
                            </v-chip>
                        </div>
                    </td>
                    <td class="py-3 text-body-2 text-medium-emphasis">
                        <template v-if="sub.next_billing">
                            {{ formatDate(sub.next_billing) }}
                        </template>
                        <span v-else class="text-caption text-disabled">—</span>
                    </td>
                    <td class="py-3">
                        <span class="text-body-2">{{ sub.payment_method || '—' }}</span>
                    </td>
                    <td class="py-3 text-right">
                        <v-btn icon="mdi-pencil-outline" variant="text" size="small" color="primary"
                            density="comfortable" @click="openEdit(sub)" />
                        <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error"
                            density="comfortable" @click="openDelete(sub)" />
                    </td>
                </tr>
            </tbody>
        </v-table>

        <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
                Showing {{ subscriptions.length }} of {{ totalSubscriptions }} subscriptions
            </span>
            <v-pagination v-if="totalPages > 1" v-model="currentPage" :length="totalPages" :total-visible="6"
                density="compact" size="small" />
        </div>
    </UiTitleCard>

    <v-dialog v-model="dialog" max-width="540" persistent>
        <SubscriptionModal :mode="modalMode" :subscription="mapToModalPayload(selectedSubscription)"
            :available-tenants="availableTenants" :loading="modalLoading" @submit="handleSubmit" @cancel="closeModal" />
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" timeout="3000">
        {{ snackbarMsg }}
        <template #actions>
            <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
        </template>
    </v-snackbar>
</template>