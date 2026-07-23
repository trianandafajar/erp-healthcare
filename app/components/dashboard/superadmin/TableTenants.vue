<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue';

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
  brand_color: string | null
  created_at: string
  plan: string
  status: string
}

const search = ref('')
const planFilter = ref('All')
const currentPage = ref(1)
const itemsPerPage = 10

const planOptions = ['All', 'free', 'basic', 'pro', 'enterprise']

const queryParams = computed(() => ({
  page: currentPage.value,
  limit: itemsPerPage,
  search: search.value || undefined,
  plan: planFilter.value !== 'All' ? planFilter.value : undefined,
}))

const { data, pending, refresh } = await useFetch<{
  tenants: Tenant[]
  total: number
  totalPages: number
}>('/api/superadmin/tenants', { query: queryParams })

const tenants = computed(() => data.value?.tenants ?? [])
const totalPages = computed(() => data.value?.totalPages ?? 1)
const totalTenants = computed(() => data.value?.total ?? 0)

watch([search, planFilter, currentPage], () => { refresh() })

function getRowNumber(index: number) {
  return (currentPage.value - 1) * itemsPerPage + index + 1
}

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

function getPlanColor(plan?: string | null) {
  if (!plan) return 'grey'
  return planColors[plan] ?? 'secondary'
}

function getPlanLabel(plan?: string | null) {
  if (!plan) return 'Free'
  return plan.charAt(0).toUpperCase() + plan.slice(1)
}

function onSearch() {
  currentPage.value = 1
}

function openDetail(tenant: Tenant) {
  navigateTo(`/super-admin/tenants/${tenant.id}`)
}

const deleteDialog = ref(false)
const tenantToDelete = ref<Tenant | null>(null)
const deleting = ref(false)

function openDeleteTenant(tenant: Tenant) {
  tenantToDelete.value = tenant
  deleteDialog.value = true
}

async function confirmDeleteTenant() {
  if (!tenantToDelete.value) return
  deleting.value = true
  try {
    await $fetch(`/api/superadmin/tenants/${tenantToDelete.value.id}`, { method: 'DELETE' })
    snackbarMsg.value = `Tenant "${tenantToDelete.value.name}" and all associated data deleted`
    snackbarColor.value = 'success'
    snackbar.value = true
    deleteDialog.value = false
    tenantToDelete.value = null
    refresh()
  } catch (e: any) {
    snackbarMsg.value = e?.data?.message ?? e?.message ?? 'Failed to delete tenant'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    deleting.value = false
  }
}

const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('success')
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
          <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase" style="width: 50px;">No</th>
          <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Tenant</th>
          <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Plan</th>
          <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Status</th>
          <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Owner</th>
          <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Users</th>
          <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Created</th>
          <th class="text-no-wrap text-right text-caption font-weight-bold text-uppercase">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="pending" v-for="i in 5" :key="i">
          <td colspan="8" style="border-bottom: none;">
            <v-skeleton-loader type="table-row" class="my-1" />
          </td>
        </tr>
        <tr v-else-if="tenants.length === 0">
          <td colspan="8" class="text-center py-8 text-medium-emphasis">
            <v-icon icon="mdi-domain-off" size="32" class="mb-2 d-block mx-auto" />
            No tenants found
          </td>
        </tr>
        <tr v-else v-for="(tenant, index) in tenants" :key="tenant.id" class="cursor-pointer"
          @click="openDetail(tenant)">
          <td class="py-3 text-body-2 text-medium-emphasis">{{ getRowNumber(index) }}</td>
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
          <td class="py-3 text-body-2">{{ (tenant.total_users ?? 0).toLocaleString() }}</td>
          <td class="py-3 text-body-2 text-medium-emphasis">{{ formatDate(tenant.created_at) }}</td>
          <td class="py-3 text-right" @click.stop>
            <div class="d-flex align-center justify-end ga-1">
              <v-tooltip v-if="tenant.subscription_plan && tenant.subscription_plan !== 'free'" location="top">
                <template #activator="{ props }">
                  <v-icon v-bind="props" icon="mdi-crown" color="amber" size="20" />
                </template>
                <span>Subscribed</span>
              </v-tooltip>
              <v-btn icon="mdi-eye" variant="text" size="small" color="primary" density="comfortable"
                @click="openDetail(tenant)" />
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon="mdi-delete-outline" variant="text" size="small" color="error"
                    density="comfortable" @click.stop="openDeleteTenant(tenant)" />
                </template>
                <span>Delete tenant</span>
              </v-tooltip>
            </div>
          </td>
        </tr>
      </tbody>
    </v-table>

    <div class="d-flex align-center justify-space-between px-4 py-2">
      <span class="text-caption text-medium-emphasis">
        Showing {{ tenants.length }} of {{ totalTenants }} tenants
      </span>
      <v-pagination v-if="totalPages > 1" v-model="currentPage" :length="totalPages" :total-visible="6"
        density="compact" size="small" />
    </div>
  </UiTitleCard>

  <v-dialog v-model="deleteDialog" max-width="480" persistent>
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-delete-outline" size="20" color="error" />
          <span class="text-h6 font-weight-bold">Delete Tenant</span>
        </div>
        <v-btn icon="mdi-close" variant="text" density="compact" :disabled="deleting" @click="deleteDialog = false; tenantToDelete = null" />
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-5">
        <div class="d-flex flex-column align-center text-center ga-3">
          <v-avatar color="error" variant="tonal" size="56">
            <v-icon icon="mdi-delete-outline" size="28" />
          </v-avatar>
          <div>
            <p class="text-body-1 font-weight-medium">
              Are you sure you want to delete this tenant?
            </p>
            <p class="text-body-2 text-medium-emphasis mt-1">
              <strong>{{ tenantToDelete?.name }}</strong> and all its data (patients, doctors, appointments, billing, etc.) will be permanently removed.
            </p>
            <p class="text-body-2 text-error mt-2 font-weight-medium">
              This action cannot be undone.
            </p>
          </div>
        </div>
      </v-card-text>
      <v-divider />
      <v-card-actions class="pa-4 pt-3">
        <v-spacer />
        <v-btn variant="tonal" color="secondary" :disabled="deleting" @click="deleteDialog = false; tenantToDelete = null">
          Cancel
        </v-btn>
        <v-btn variant="flat" color="error" :loading="deleting" :disabled="deleting"
          :style="deleting ? 'cursor: not-allowed; pointer-events: auto;' : ''" @click="confirmDeleteTenant">
          Delete Tenant
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" timeout="3000">
    {{ snackbarMsg }}
    <template #actions>
      <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
    </template>
  </v-snackbar>
</template>