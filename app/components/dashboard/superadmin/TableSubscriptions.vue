<script setup lang="ts">
import { ref, computed } from 'vue'
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue'
import SubscriptionModal from './SubscriptionModal.vue'

interface Subscription {
  id: string
  tenant_id: string
  tenant_name: string
  tenant_slug: string
  plan: string
  status: string
  billing_cycle: string
  amount: number
  start_date: string
  next_billing: string
  trial_ends: string | null
  payment_method: string
}

const dummySubscriptions: Subscription[] = [
  { id: 's1', tenant_id: '1', tenant_name: 'Klinik Sehat', tenant_slug: 'klinik-sehat', plan: 'Pro', status: 'active', billing_cycle: 'monthly', amount: 99, start_date: '2026-06-15T08:00:00Z', next_billing: '2026-07-15T08:00:00Z', trial_ends: null, payment_method: 'Visa •••• 4242' },
  { id: 's2', tenant_id: '2', tenant_name: 'RS Harapan', tenant_slug: 'rs-harapan', plan: 'Enterprise', status: 'active', billing_cycle: 'yearly', amount: 1990, start_date: '2026-06-10T10:30:00Z', next_billing: '2027-06-10T10:30:00Z', trial_ends: null, payment_method: 'Bank Transfer' },
  { id: 's3', tenant_id: '3', tenant_name: 'Puskesmas Maju', tenant_slug: 'puskesmas-maju', plan: 'Basic', status: 'active', billing_cycle: 'monthly', amount: 49, start_date: '2026-06-05T14:15:00Z', next_billing: '2026-07-05T14:15:00Z', trial_ends: null, payment_method: 'Visa •••• 1111' },
  { id: 's4', tenant_id: '4', tenant_name: 'Klinik Medika', tenant_slug: 'klinik-medika', plan: 'Free', status: 'active', billing_cycle: 'monthly', amount: 0, start_date: '2026-05-28T09:45:00Z', next_billing: '2026-07-28T09:45:00Z', trial_ends: null, payment_method: 'N/A' },
  { id: 's5', tenant_id: '5', tenant_name: 'RS Bunda', tenant_slug: 'rs-bunda', plan: 'Pro', status: 'active', billing_cycle: 'yearly', amount: 990, start_date: '2026-05-20T11:00:00Z', next_billing: '2027-05-20T11:00:00Z', trial_ends: null, payment_method: 'Bank Transfer' },
  { id: 's6', tenant_id: '6', tenant_name: 'Klinik Husada', tenant_slug: 'klinik-husada', plan: 'Basic', status: 'suspended', billing_cycle: 'monthly', amount: 49, start_date: '2026-05-15T16:20:00Z', next_billing: '', trial_ends: null, payment_method: 'Visa •••• 3333' },
  { id: 's7', tenant_id: '7', tenant_name: 'RS Mata Indah', tenant_slug: 'rs-mata-indah', plan: 'Enterprise', status: 'active', billing_cycle: 'yearly', amount: 1990, start_date: '2026-05-10T07:45:00Z', next_billing: '2027-05-10T07:45:00Z', trial_ends: null, payment_method: 'Bank Transfer' },
  { id: 's8', tenant_id: '8', tenant_name: 'Klinik Gigi Cerah', tenant_slug: 'klinik-gigi-cerah', plan: 'Free', status: 'trial', billing_cycle: 'monthly', amount: 0, start_date: '2026-04-28T13:30:00Z', next_billing: '2026-08-28T13:30:00Z', trial_ends: '2026-08-28T13:30:00Z', payment_method: 'N/A' },
  { id: 's9', tenant_id: '9', tenant_name: 'RS Jiwa Damai', tenant_slug: 'rs-jiwa-damai', plan: 'Pro', status: 'active', billing_cycle: 'monthly', amount: 99, start_date: '2026-04-20T09:00:00Z', next_billing: '2026-07-20T09:00:00Z', trial_ends: null, payment_method: 'Visa •••• 5555' },
  { id: 's10', tenant_id: '10', tenant_name: 'Puskesmas Sehati', tenant_slug: 'puskesmas-sehati', plan: 'Basic', status: 'active', billing_cycle: 'monthly', amount: 49, start_date: '2026-04-10T15:00:00Z', next_billing: '2026-07-10T15:00:00Z', trial_ends: null, payment_method: 'Bank Transfer' },
  { id: 's11', tenant_id: '11', tenant_name: 'Klinik Bersalin Ibu', tenant_slug: 'klinik-bersalin-ibu', plan: 'Pro', status: 'active', billing_cycle: 'yearly', amount: 990, start_date: '2026-03-25T11:15:00Z', next_billing: '2027-03-25T11:15:00Z', trial_ends: null, payment_method: 'Visa •••• 7777' },
  { id: 's12', tenant_id: '12', tenant_name: 'RS Umum Sentosa', tenant_slug: 'rs-umum-sentosa', plan: 'Enterprise', status: 'cancelled', billing_cycle: 'monthly', amount: 199, start_date: '2026-03-15T08:30:00Z', next_billing: '', trial_ends: null, payment_method: 'Visa •••• 8888' },
]

const subscriptions = ref<Subscription[]>([...dummySubscriptions])

const search = ref('')
const planFilter = ref('All Plan')
const statusFilter = ref('All Status')
const currentPage = ref(1)
const itemsPerPage = 10

const planOptions = ['All Plan', 'Free', 'Basic', 'Pro', 'Enterprise']
const statusOptions = ['All Status', 'active', 'suspended', 'trial', 'cancelled']

const filteredSubscriptions = computed(() => {
  return subscriptions.value.filter((s) => {
    const q = search.value.toLowerCase()
    const matchesSearch =
      !q ||
      s.tenant_name.toLowerCase().includes(q) ||
      s.tenant_slug.toLowerCase().includes(q) ||
      s.payment_method.toLowerCase().includes(q)
    const matchesPlan = planFilter.value === 'All Plan' || s.plan === planFilter.value
    const matchesStatus = statusFilter.value === 'All Status' || s.status === statusFilter.value
    return matchesSearch && matchesPlan && matchesStatus
  })
})

const paginatedSubscriptions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredSubscriptions.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() => Math.ceil(filteredSubscriptions.value.length / itemsPerPage))

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

function formatDate(dateStr: string) {
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

function onSearch() {
  currentPage.value = 1
}

const dialog = ref(false)
const modalMode = ref<'add' | 'edit' | 'delete'>('add')
const selectedSubscription = ref<Subscription | null>(null)

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

const availableTenants = computed(() => {
  const subscribedIds = new Set(subscriptions.value.map((s) => s.tenant_id))
  return dummySubscriptions
    .filter((s) => !subscribedIds.has(s.tenant_id) || modalMode.value === 'edit')
    .map((s) => ({ id: s.tenant_id, name: s.tenant_name, slug: s.tenant_slug }))
    .filter((t, i, arr) => arr.findIndex((a) => a.id === t.id) === i)
})

function handleSubmit(payload: any) {
  if (modalMode.value === 'add') {
    const tenant = dummySubscriptions.find((s) => s.tenant_id === payload.tenant_id)
    if (!tenant) return
    const newSub: Subscription = {
      id: 's' + Date.now(),
      tenant_id: payload.tenant_id,
      tenant_name: tenant.tenant_name,
      tenant_slug: tenant.tenant_slug,
      plan: payload.plan,
      status: payload.status,
      billing_cycle: payload.billing_cycle,
      amount: payload.amount,
      start_date: payload.start_date + 'T00:00:00Z',
      next_billing: payload.start_date + 'T00:00:00Z',
      trial_ends: payload.status === 'trial' ? payload.start_date + 'T00:00:00Z' : null,
      payment_method: payload.payment_method || 'N/A',
    }
    subscriptions.value.push(newSub)
    notify(`Subscription created for ${newSub.tenant_name}`)
  } else if (modalMode.value === 'edit' && selectedSubscription.value) {
    const sub = subscriptions.value.find((s) => s.id === selectedSubscription.value!.id)
    if (sub) {
      sub.plan = payload.plan
      sub.status = payload.status
      sub.billing_cycle = payload.billing_cycle
      sub.amount = payload.amount
      sub.start_date = payload.start_date + 'T00:00:00Z'
      sub.payment_method = payload.payment_method
      sub.next_billing = payload.start_date + 'T00:00:00Z'
      sub.trial_ends = payload.status === 'trial' ? payload.start_date + 'T00:00:00Z' : null
    }
    notify(`Subscription updated for ${selectedSubscription.value.tenant_name}`)
  } else if (modalMode.value === 'delete' && selectedSubscription.value) {
    subscriptions.value = subscriptions.value.filter((s) => s.id !== selectedSubscription.value!.id)
    notify(`Subscription removed for ${selectedSubscription.value.tenant_name}`)
  }
  closeModal()
}

function getStatusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function getAmountLabel(sub: Subscription) {
  if (sub.amount === 0) return 'Free'
  const cycle = sub.billing_cycle === 'yearly' ? '/yr' : '/mo'
  return formatCurrency(sub.amount) + cycle
}

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function trialDaysLeft(sub: Subscription): number | null {
  if (sub.status !== 'trial' || !sub.trial_ends) return null
  return daysUntil(sub.trial_ends)
}
</script>

<template>
  <v-card-item class="pb-2 px-0 pt-0">
    <div class="d-flex justify-space-between align-center">
      <div>
        <v-card-title class="text-h3">Subscriptions Management</v-card-title>
        <v-card-subtitle class="mt-1">Manage subscription plans and tenant assignments</v-card-subtitle>
      </div>
      <v-btn color="primary" variant="flat" size="large" prepend-icon="mdi-plus" density="comfortable" @click="openAdd">
        Add Subscription
      </v-btn>
    </div>
  </v-card-item>

  <UiTitleCard class-name="px-0 pb-0 rounded-md">
    <div class="d-flex align-center justify-space-between gap-3 px-4 py-3 flex-wrap">
      <div class="d-flex align-center flex-grow-1" style="min-width: 220px; max-width: 400px">
        <v-text-field v-model="search" placeholder="Search by tenant or payment..." prepend-inner-icon="mdi-magnify"
          variant="outlined" density="compact" hide-details clearable @update:model-value="onSearch" />
      </div>

      <div class="d-flex align-center ga-3">
        <v-select v-model="planFilter" :items="planOptions" variant="outlined" density="compact" hide-details
          style="max-width: 250px" @update:model-value="onSearch" />
        <v-select v-model="statusFilter" :items="statusOptions" variant="outlined" density="compact" hide-details
          style="max-width: 250px" @update:model-value="onSearch" />
      </div>
    </div>

    <v-divider />

    <v-table class="bordered-table" hover density="comfortable">
      <thead class="bg-containerBg">
        <tr>
          <th class="text-left text-caption font-weight-bold text-uppercase">Tenant</th>
          <th class="text-left text-caption font-weight-bold text-uppercase">Plan</th>
          <th class="text-left text-caption font-weight-bold text-uppercase">Amount</th>
          <th class="text-left text-caption font-weight-bold text-uppercase">Cycle</th>
          <th class="text-left text-caption font-weight-bold text-uppercase">Status</th>
          <th class="text-left text-caption font-weight-bold text-uppercase">Next Billing</th>
          <th class="text-left text-caption font-weight-bold text-uppercase">Payment</th>
          <th class="text-right text-caption font-weight-bold text-uppercase">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="paginatedSubscriptions.length === 0">
          <td colspan="8" class="text-center py-8 text-medium-emphasis">
            <v-icon icon="mdi-credit-card-off-outline" size="36" class="mb-2 d-block mx-auto" />
            <div class="text-body-1 font-weight-medium mb-1">No subscriptions found</div>
            <div class="text-caption">
              <template v-if="subscriptions.length === 0">
                Get started by adding your first subscription.
              </template>
              <template v-else>
                Try adjusting your search or filter criteria.
              </template>
            </div>
          </td>
        </tr>
        <tr v-else v-for="sub in paginatedSubscriptions" :key="sub.id">
          <td class="py-3">
            <div class="d-flex align-center ga-3">
              <v-avatar size="34" color="primary" variant="tonal">
                <span class="text-caption font-weight-bold">{{ getInitials(sub.tenant_name) }}</span>
              </v-avatar>
              <div>
                <div class="text-body-2 font-weight-medium">{{ sub.tenant_name }}</div>
                <div class="text-caption text-medium-emphasis">{{ sub.tenant_slug }}</div>
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
              <v-icon :icon="cycleIcons[sub.billing_cycle]" size="16" class="text-medium-emphasis" />
              <span class="text-caption text-medium-emphasis text-capitalize">{{ sub.billing_cycle }}</span>
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
            <span class="text-body-2">{{ sub.payment_method }}</span>
          </td>
          <td class="py-3 text-right">
            <v-btn icon="mdi-pencil-outline" variant="text" size="small" color="primary" density="comfortable"
              @click="openEdit(sub)" />
            <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error" density="comfortable"
              @click="openDelete(sub)" />
          </td>
        </tr>
      </tbody>
    </v-table>

    <div class="d-flex align-center justify-space-between px-4 py-2">
      <span class="text-caption text-medium-emphasis">
        Showing {{ paginatedSubscriptions.length }} of {{ filteredSubscriptions.length }} subscriptions
      </span>
      <v-pagination v-if="totalPages > 1" v-model="currentPage" :length="totalPages" :total-visible="6"
        density="compact" size="small" />
    </div>
  </UiTitleCard>

  <v-dialog v-model="dialog" max-width="540" persistent>
    <SubscriptionModal :mode="modalMode" :subscription="selectedSubscription" :available-tenants="availableTenants"
      @submit="handleSubmit" @cancel="closeModal" />
  </v-dialog>

  <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" timeout="3000">
    {{ snackbarMsg }}
    <template #actions>
      <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
    </template>
  </v-snackbar>
</template>
