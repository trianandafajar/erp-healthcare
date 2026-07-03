<script setup lang="ts">
import { ref, computed } from 'vue';
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue';
import TenantModal from './TenantModal.vue';

interface Tenant {
  id: string
  name: string
  slug: string
  plan: string
  status: string
  owner: string
  owner_email: string
  users: number
  created_at: string
}

const dummyTenants: Tenant[] = [
  { id: '1', name: 'Klinik Sehat', slug: 'klinik-sehat', plan: 'Pro', status: 'active', owner: 'Dr. Andi', owner_email: 'andi@kliniksehat.com', users: 45, created_at: '2026-06-15T08:00:00Z' },
  { id: '2', name: 'RS Harapan', slug: 'rs-harapan', plan: 'Enterprise', status: 'active', owner: 'Dr. Budi', owner_email: 'budi@rsharapan.com', users: 120, created_at: '2026-06-10T10:30:00Z' },
  { id: '3', name: 'Puskesmas Maju', slug: 'puskesmas-maju', plan: 'Basic', status: 'active', owner: 'Siti Rahmawati', owner_email: 'siti@puskesmasmaju.com', users: 28, created_at: '2026-06-05T14:15:00Z' },
  { id: '4', name: 'Klinik Medika', slug: 'klinik-medika', plan: 'Free', status: 'active', owner: 'Dr. Cici', owner_email: 'cici@medika.com', users: 12, created_at: '2026-05-28T09:45:00Z' },
  { id: '5', name: 'RS Bunda', slug: 'rs-bunda', plan: 'Pro', status: 'active', owner: 'Dr. Dewi', owner_email: 'dewi@rsbunda.com', users: 89, created_at: '2026-05-20T11:00:00Z' },
  { id: '6', name: 'Klinik Husada', slug: 'klinik-husada', plan: 'Basic', status: 'suspended', owner: 'Ahmad Fauzi', owner_email: 'ahmad@husada.com', users: 0, created_at: '2026-05-15T16:20:00Z' },
  { id: '7', name: 'RS Mata Indah', slug: 'rs-mata-indah', plan: 'Enterprise', status: 'active', owner: 'Dr. Eko', owner_email: 'eko@mataindah.com', users: 67, created_at: '2026-05-10T07:45:00Z' },
  { id: '8', name: 'Klinik Gigi Cerah', slug: 'klinik-gigi-cerah', plan: 'Free', status: 'active', owner: 'Dr. Fitri', owner_email: 'fitri@gigicerah.com', users: 8, created_at: '2026-04-28T13:30:00Z' },
  { id: '9', name: 'RS Jiwa Damai', slug: 'rs-jiwa-damai', plan: 'Pro', status: 'active', owner: 'Dr. Gunawan', owner_email: 'gunawan@jiwadamai.com', users: 34, created_at: '2026-04-20T09:00:00Z' },
  { id: '10', name: 'Puskesmas Sehati', slug: 'puskesmas-sehati', plan: 'Basic', status: 'active', owner: 'Hesti', owner_email: 'hesti@sehati.com', users: 19, created_at: '2026-04-10T15:00:00Z' },
  { id: '11', name: 'Klinik Bersalin Ibu', slug: 'klinik-bersalin-ibu', plan: 'Pro', status: 'active', owner: 'Dr. Indah', owner_email: 'indah@bersalinibu.com', users: 52, created_at: '2026-03-25T11:15:00Z' },
  { id: '12', name: 'RS Umum Sentosa', slug: 'rs-umum-sentosa', plan: 'Enterprise', status: 'suspended', owner: 'Dr. Joko', owner_email: 'joko@sentosa.com', users: 0, created_at: '2026-03-15T08:30:00Z' },
]

const search = ref('')
const planFilter = ref('All')
const currentPage = ref(1)
const itemsPerPage = 10

const planOptions = ['All', 'Free', 'Basic', 'Pro', 'Enterprise']

const filteredTenants = computed(() => {
  return dummyTenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.value.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.value.toLowerCase()) ||
      t.owner.toLowerCase().includes(search.value.toLowerCase())
    const matchesPlan = planFilter.value === 'All' || t.plan === planFilter.value
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
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const planColors: Record<string, string> = {
  Free: 'grey',
  Basic: 'primary',
  Pro: 'warning',
  Enterprise: 'error',
}

function getPlanColor(plan: string) {
  return planColors[plan] ?? 'secondary'
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
  const tenant = dummyTenants.find((t) => t.id === selectedTenant.value!.id)
  if (tenant) {
    tenant.plan = payload.plan
    tenant.status = payload.status
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
    <template #title>
      <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex justify-space-between align-center">
          <div>
            <v-card-title class="text-h3">Tenants Management</v-card-title>
            <v-card-subtitle class="mt-1">Manage all registered tenants and their subscriptions</v-card-subtitle>
          </div>
        </div>
      </v-card-item>
    </template>

    <div class="d-flex align-center justify-space-between gap-3 px-4 py-3 flex-wrap">
      <div class="d-flex align-center ga-3">
        <v-text-field v-model="search" placeholder="Search by name, slug, or owner..." prepend-inner-icon="mdi-magnify"
          variant="outlined" density="compact" hide-details clearable style="max-width: 320px"
          @update:model-value="onSearch" />
        <v-select v-model="planFilter" :items="planOptions" variant="outlined" density="compact" hide-details
          style="max-width: 160px" />
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
        <tr v-if="paginatedTenants.length === 0">
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
            <v-chip :color="getPlanColor(tenant.plan)" variant="tonal" size="small">
              {{ tenant.plan }}
            </v-chip>
          </td>
          <td class="py-3">
            <v-chip :color="tenant.status === 'active' ? 'success' : 'error'" variant="tonal" size="small">
              {{ tenant.status === 'active' ? 'Active' : 'Suspended' }}
            </v-chip>
          </td>
          <td class="py-3">
            <div class="text-body-2 font-weight-medium">{{ tenant.owner }}</div>
            <div class="text-caption text-medium-emphasis">{{ tenant.owner_email }}</div>
          </td>
          <td class="py-3 text-body-2">{{ tenant.users.toLocaleString() }}</td>
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
