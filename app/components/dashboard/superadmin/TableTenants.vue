<script setup lang="ts">
import { ref, computed } from 'vue';
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue';
import TenantModal from './TenantModal.vue';

interface TenantOwner {
  id: string
  email: string
  full_name: string
}

interface Tenant {
  id: string
  name: string
  slug: string
  subscription_plan: string
  subscription_status: string
  owner_id: string
  owner: TenantOwner | null
  total_users: number
  created_at: string
}

const { data, pending } = await useFetch<Tenant[]>('/api/superadmin/tenants')
const tenants = computed(() => data.value ?? [])

const search = ref('')
const planFilter = ref('All')
const currentPage = ref(1)
const itemsPerPage = 10

const planOptions = ['All', 'free', 'basic', 'pro', 'enterprise']

const filteredTenants = computed(() => {
  return tenants.value.filter((t) => {
    const q = search.value.toLowerCase()
    const matchesSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q) ||
      (t.owner?.full_name ?? '').toLowerCase().includes(q) ||
      (t.owner?.email ?? '').toLowerCase().includes(q)
    const matchesPlan = planFilter.value === 'All' || t.subscription_plan === planFilter.value
    return matchesSearch && matchesPlan
  })
})

const paginatedTenants = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredTenants.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() => Math.ceil(filteredTenants.value.length / itemsPerPage))

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const planColors: Record<string, string> = {
  free: 'grey',
  basic: 'primary',
  pro: 'warning',
  enterprise: 'error',
}

function getPlanColor(plan: string) {
  return planColors[plan] ?? 'secondary'
}

function getPlanLabel(plan: string) {
  return plan.charAt(0).toUpperCase() + plan.slice(1)
}

function onSearch() {
  currentPage.value = 1
}

function openDetail(tenant: Tenant) {
  navigateTo(`/super-admin/tenants/${tenant.id}`)
}

const dialog = ref(false)
const selectedTenant = ref<Tenant | null>(null)

function openEdit(tenant: Tenant) {
  selectedTenant.value = tenant
  dialog.value = true
}

function closeModal() {
  dialog.value = false
  selectedTenant.value = null
}

const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('success')

function notify(msg: string, color = 'success') {
  snackbarMsg.value = msg
  snackbarColor.value = color
  snackbar.value = true
}

function handleEditSubmit(payload: { plan: string; status: string }) {
  if (!selectedTenant.value) return
  const tenant = tenants.value.find((t) => t.id === selectedTenant.value!.id)
  if (tenant) {
    tenant.subscription_plan = payload.plan
    tenant.subscription_status = payload.status
  }
  notify(`Subscription updated for ${selectedTenant.value.name}`)
  closeModal()
}
</script>

<template>
  <v-card-item class="pb-2 px-0 pt-0">
    <div>
      <v-card-title class="text-h3">Tenants Management</v-card-title>
      <v-card-subtitle class="mt-1">
        Manage all registered tenants and their subscriptions
      </v-card-subtitle>
    </div>
  </v-card-item>

  <UiTitleCard class-name="px-0 pb-0 rounded-md">
    <div class="d-flex align-center justify-space-between gap-3 px-4 py-3 flex-wrap">
      <v-text-field v-model="search" placeholder="Search by name, slug, or owner..." prepend-inner-icon="mdi-magnify"
        variant="outlined" density="compact" hide-details clearable class="flex-shrink-0" style="max-width: 280px"
        @update:model-value="onSearch" />

      <div class="d-flex align-center ga-2">
        <v-select v-model="planFilter" :items="planOptions" variant="outlined" density="compact" hide-details
          class="flex-shrink-0" style="width: 160px" @update:model-value="onSearch" />
      </div>
    </div>
    <v-divider />

    <v-table class="bordered-table" hover density="comfortable">
      <thead class="bg-containerBg">
        <tr>
          <th class="text-left text-caption font-weight-bold text-uppercase">Tenant</th>
          <th class="text-left text-caption font-weight-bold text-uppercase">Plan</th>
          <th class="text-left text-caption font-weight-bold text-uppercase">Status</th>
          <th class="text-left text-caption font-weight-bold text-uppercase">Owner</th>
          <th class="text-left text-caption font-weight-bold text-uppercase">Users</th>
          <th class="text-left text-caption font-weight-bold text-uppercase">Created</th>
          <th class="text-right text-caption font-weight-bold text-uppercase">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="pending">
          <td colspan="7" class="text-center py-8 text-medium-emphasis">
            Loading tenants...
          </td>
        </tr>
        <tr v-else-if="paginatedTenants.length === 0">
          <td colspan="7" class="text-center py-8 text-medium-emphasis">
            <v-icon icon="mdi-domain-off" size="32" class="mb-2 d-block mx-auto" />
            No tenants found
          </td>
        </tr>
        <tr v-else v-for="tenant in paginatedTenants" :key="tenant.id" class="cursor-pointer"
          @click="openDetail(tenant)">
          <td class="py-3">
            <div class="d-flex align-center ga-3">
              <v-avatar size="34" color="primary" variant="tonal">
                <span class="text-caption font-weight-bold">{{ getInitials(tenant.name) }}</span>
              </v-avatar>
              <div>
                <div class="text-body-2 font-weight-medium">{{ tenant.name }}</div>
                <div class="text-caption text-medium-emphasis">{{ tenant.slug }}</div>
              </div>
            </div>
          </td>
          <td class="py-3">
            <v-chip :color="getPlanColor(tenant.subscription_plan)" variant="tonal" size="small">
              {{ getPlanLabel(tenant.subscription_plan) }}
            </v-chip>
          </td>
          <td class="py-3">
            <v-chip :color="tenant.subscription_status === 'active' ? 'success' : 'error'" variant="tonal" size="small">
              {{ tenant.subscription_status === 'active' ? 'Active' : 'Suspended' }}
            </v-chip>
          </td>
          <td class="py-3">
            <div class="text-body-2 font-weight-medium">{{ tenant.owner?.full_name ?? '—' }}</div>
            <div class="text-caption text-medium-emphasis">{{ tenant.owner?.email ?? '—' }}</div>
          </td>
          <td class="py-3 text-body-2">{{ tenant.total_users.toLocaleString() }}</td>
          <td class="py-3 text-body-2 text-medium-emphasis">{{ formatDate(tenant.created_at) }}</td>
          <td class="py-3 text-right" @click.stop>
            <v-btn icon="mdi-eye" variant="text" size="small" color="primary" density="comfortable"
              @click="openDetail(tenant)" />
            <v-btn icon="mdi-pencil-outline" variant="text" size="small" color="primary" density="comfortable"
              @click="openEdit(tenant)" />
          </td>
        </tr>
      </tbody>
    </v-table>

    <div class="d-flex align-center justify-space-between px-4 py-2">
      <span class="text-caption text-medium-emphasis">
        Showing {{ paginatedTenants.length }} of {{ filteredTenants.length }} tenants
      </span>
      <v-pagination v-if="totalPages > 1" v-model="currentPage" :length="totalPages" :total-visible="6"
        density="compact" size="small" />
    </div>
  </UiTitleCard>

  <v-dialog v-model="dialog" max-width="480" persistent>
    <TenantModal :tenant="selectedTenant" @submit="handleEditSubmit" @cancel="closeModal" />
  </v-dialog>

  <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" timeout="3000">
    {{ snackbarMsg }}
    <template #actions>
      <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
    </template>
  </v-snackbar>
</template>