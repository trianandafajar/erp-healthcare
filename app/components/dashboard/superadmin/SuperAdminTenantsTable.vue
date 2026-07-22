<script setup lang="ts">
import { ref, computed } from 'vue'
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue'

interface Tenant {
  id: string
  name: string
  slug: string
  plan: string
  status: string
  owner: string
  users: number
  created_at: string
}

const dummyTenants: Tenant[] = [
  { id: '1', name: 'Klinik Sehat', slug: 'klinik-sehat', plan: 'Pro', status: 'active', owner: 'Dr. Andi', users: 45, created_at: '2026-06-15T08:00:00Z' },
  { id: '2', name: 'RS Harapan', slug: 'rs-harapan', plan: 'Enterprise', status: 'active', owner: 'Dr. Budi', users: 120, created_at: '2026-06-10T10:30:00Z' },
  { id: '3', name: 'Puskesmas Maju', slug: 'puskesmas-maju', plan: 'Basic', status: 'active', owner: 'Siti', users: 28, created_at: '2026-06-05T14:15:00Z' },
  { id: '4', name: 'Klinik Medika', slug: 'klinik-medika', plan: 'Free', status: 'active', owner: 'Dr. Cici', users: 12, created_at: '2026-05-28T09:45:00Z' },
  { id: '5', name: 'RS Bunda', slug: 'rs-bunda', plan: 'Pro', status: 'active', owner: 'Dr. Dewi', users: 89, created_at: '2026-05-20T11:00:00Z' },
  { id: '6', name: 'Klinik Husada', slug: 'klinik-husada', plan: 'Basic', status: 'suspended', owner: 'Ahmad', users: 0, created_at: '2026-05-15T16:20:00Z' },
]

const search = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

const filteredTenants = computed(() => {
  if (!search.value) return dummyTenants
  const q = search.value.toLowerCase()
  return dummyTenants.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q) ||
      t.owner.toLowerCase().includes(q)
  )
})

const paginatedTenants = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredTenants.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() => Math.ceil(filteredTenants.value.length / itemsPerPage))

const planColors: Record<string, string> = {
  Free: 'grey',
  Basic: 'primary',
  Pro: 'warning',
  Enterprise: 'error',
}

function getPlanColor(plan: string) {
  return planColors[plan] ?? 'secondary'
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 1) return 'Today'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
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
</script>

<template>
  <UiTitleCard class-name="px-0 pb-0 rounded-md">
    <v-card-item class="pb-2">
      <v-card-title class="text-h5">Recent Tenants</v-card-title>
      <v-card-subtitle>Latest registered tenants and subscription overview</v-card-subtitle>
    </v-card-item <v-divider />

    <v-table class="bordered-table" hover density="comfortable">
      <thead class="bg-containerBg">
        <tr>
          <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Tenant</th>
          <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Plan</th>
          <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Status</th>
          <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Owner</th>
          <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Users</th>
          <th class="text-no-wrap text-right text-caption font-weight-bold text-uppercase">Joined</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="paginatedTenants.length === 0">
          <td colspan="6" class="text-center py-8 text-medium-emphasis">
            <v-icon icon="mdi-domain-off" size="32" class="mb-2 d-block mx-auto" />
            No tenants found
          </td>
        </tr>
        <tr v-else v-for="tenant in paginatedTenants" :key="tenant.id">
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
          <td class="py-3 text-body-2">{{ tenant.owner }}</td>
          <td class="py-3 text-body-2">{{ tenant.users.toLocaleString() }}</td>
          <td class="py-3 text-right text-body-2 text-medium-emphasis">
            {{ formatDate(tenant.created_at) }}
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
</template>
