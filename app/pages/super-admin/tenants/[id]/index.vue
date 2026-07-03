<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({
  layout: 'superadmin',
  middleware: ['auth'],
})

useSeoMeta({
  title: 'Tenant Detail',
  ogTitle: 'Tenant Detail',
})

const route = useRoute()
const tenantId = computed(() => route.params.id as string)

interface TenantDetail {
  id: string
  name: string
  slug: string
  plan: string
  status: string
  owner: string
  owner_email: string
  owner_phone: string
  users: number
  doctors: number
  patients: number
  appointments: number
  created_at: string
  subscription_since: string
}

interface TenantUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  joined_at: string
}

const dummyTenants: Record<string, TenantDetail> = {
  '1': {
    id: '1', name: 'Klinik Sehat', slug: 'klinik-sehat', plan: 'Pro', status: 'active',
    owner: 'Dr. Andi Pratama', owner_email: 'andi@kliniksehat.com', owner_phone: '+62812-3456-7890',
    users: 45, doctors: 5, patients: 120, appointments: 340,
    created_at: '2026-06-15T08:00:00Z', subscription_since: '2026-06-15T08:00:00Z',
  },
  '2': {
    id: '2', name: 'RS Harapan', slug: 'rs-harapan', plan: 'Enterprise', status: 'active',
    owner: 'Dr. Budi Santoso', owner_email: 'budi@rsharapan.com', owner_phone: '+62821-2345-6789',
    users: 120, doctors: 25, patients: 450, appointments: 1200,
    created_at: '2026-06-10T10:30:00Z', subscription_since: '2026-06-10T10:30:00Z',
  },
  '3': {
    id: '3', name: 'Puskesmas Maju', slug: 'puskesmas-maju', plan: 'Basic', status: 'active',
    owner: 'Siti Rahmawati', owner_email: 'siti@puskesmasmaju.com', owner_phone: '+62831-3456-7890',
    users: 28, doctors: 3, patients: 200, appointments: 560,
    created_at: '2026-06-05T14:15:00Z', subscription_since: '2026-06-05T14:15:00Z',
  },
  '4': {
    id: '4', name: 'Klinik Medika', slug: 'klinik-medika', plan: 'Free', status: 'active',
    owner: 'Dr. Cici', owner_email: 'cici@medika.com', owner_phone: '+62811-111-2222',
    users: 12, doctors: 1, patients: 30, appointments: 85,
    created_at: '2026-05-28T09:45:00Z', subscription_since: '2026-05-28T09:45:00Z',
  },
  '5': {
    id: '5', name: 'RS Bunda', slug: 'rs-bunda', plan: 'Pro', status: 'active',
    owner: 'Dr. Dewi', owner_email: 'dewi@rsbunda.com', owner_phone: '+62822-333-4444',
    users: 89, doctors: 18, patients: 350, appointments: 980,
    created_at: '2026-05-20T11:00:00Z', subscription_since: '2026-05-20T11:00:00Z',
  },
  '6': {
    id: '6', name: 'Klinik Husada', slug: 'klinik-husada', plan: 'Basic', status: 'suspended',
    owner: 'Ahmad Fauzi', owner_email: 'ahmad@husada.com', owner_phone: '+62851-234-5678',
    users: 0, doctors: 0, patients: 0, appointments: 0,
    created_at: '2026-05-15T16:20:00Z', subscription_since: '2026-05-15T16:20:00Z',
  },
  '7': {
    id: '7', name: 'RS Mata Indah', slug: 'rs-mata-indah', plan: 'Enterprise', status: 'active',
    owner: 'Dr. Eko', owner_email: 'eko@mataindah.com', owner_phone: '+62877-555-6666',
    users: 67, doctors: 12, patients: 220, appointments: 640,
    created_at: '2026-05-10T07:45:00Z', subscription_since: '2026-05-10T07:45:00Z',
  },
  '8': {
    id: '8', name: 'Klinik Gigi Cerah', slug: 'klinik-gigi-cerah', plan: 'Free', status: 'active',
    owner: 'Dr. Fitri', owner_email: 'fitri@gigicerah.com', owner_phone: '+62888-777-6666',
    users: 8, doctors: 1, patients: 25, appointments: 70,
    created_at: '2026-04-28T13:30:00Z', subscription_since: '2026-04-28T13:30:00Z',
  },
  '9': {
    id: '9', name: 'RS Jiwa Damai', slug: 'rs-jiwa-damai', plan: 'Pro', status: 'active',
    owner: 'Dr. Gunawan', owner_email: 'gunawan@jiwadamai.com', owner_phone: '+62899-888-7777',
    users: 34, doctors: 7, patients: 100, appointments: 310,
    created_at: '2026-04-20T09:00:00Z', subscription_since: '2026-04-20T09:00:00Z',
  },
  '10': {
    id: '10', name: 'Puskesmas Sehati', slug: 'puskesmas-sehati', plan: 'Basic', status: 'active',
    owner: 'Hesti', owner_email: 'hesti@sehati.com', owner_phone: '+62866-555-4444',
    users: 19, doctors: 2, patients: 80, appointments: 210,
    created_at: '2026-04-10T15:00:00Z', subscription_since: '2026-04-10T15:00:00Z',
  },
  '11': {
    id: '11', name: 'Klinik Bersalin Ibu', slug: 'klinik-bersalin-ibu', plan: 'Pro', status: 'active',
    owner: 'Dr. Indah', owner_email: 'indah@bersalinibu.com', owner_phone: '+62833-222-1111',
    users: 52, doctors: 8, patients: 180, appointments: 510,
    created_at: '2026-03-25T11:15:00Z', subscription_since: '2026-03-25T11:15:00Z',
  },
  '12': {
    id: '12', name: 'RS Umum Sentosa', slug: 'rs-umum-sentosa', plan: 'Enterprise', status: 'suspended',
    owner: 'Dr. Joko', owner_email: 'joko@sentosa.com', owner_phone: '+62844-333-2222',
    users: 0, doctors: 0, patients: 0, appointments: 0,
    created_at: '2026-03-15T08:30:00Z', subscription_since: '2026-03-15T08:30:00Z',
  },
}

const dummyUsers: Record<string, TenantUser[]> = {
  '1': [
    { id: 'u1', name: 'Dr. Andi Pratama', email: 'andi@kliniksehat.com', role: 'admin', status: 'active', joined_at: '2026-06-15T08:00:00Z' },
    { id: 'u2', name: 'Siti Nurhaliza', email: 'siti@kliniksehat.com', role: 'receptionist', status: 'active', joined_at: '2026-06-15T09:00:00Z' },
    { id: 'u3', name: 'Bambang', email: 'bambang@kliniksehat.com', role: 'nurse', status: 'active', joined_at: '2026-06-16T08:00:00Z' },
    { id: 'u4', name: 'Dr. Dewi', email: 'dewi@kliniksehat.com', role: 'doctor', status: 'active', joined_at: '2026-06-17T10:00:00Z' },
    { id: 'u5', name: 'Ahmad', email: 'ahmad@kliniksehat.com', role: 'pharmacy', status: 'active', joined_at: '2026-06-18T07:30:00Z' },
  ],
  '2': [
    { id: 'u6', name: 'Dr. Budi Santoso', email: 'budi@rsharapan.com', role: 'admin', status: 'active', joined_at: '2026-06-10T10:30:00Z' },
    { id: 'u7', name: 'Rina', email: 'rina@rsharapan.com', role: 'receptionist', status: 'active', joined_at: '2026-06-10T11:00:00Z' },
    { id: 'u8', name: 'Dr. Hadi', email: 'hadi@rsharapan.com', role: 'doctor', status: 'active', joined_at: '2026-06-11T08:00:00Z' },
  ],
}

const tenant = computed(() => {
  const dummyTenant = dummyTenants[tenantId.value]
  if (dummyTenant) return dummyTenant
  return {
    id: tenantId.value, name: 'Unknown Tenant', slug: '-', plan: '-', status: 'unknown',
    owner: '-', owner_email: '-', owner_phone: '-',
    users: 0, doctors: 0, patients: 0, appointments: 0,
    created_at: '-', subscription_since: '-',
  }
})

const users = computed(() => dummyUsers[tenantId.value] ?? [])

function formatDate(dateStr: string) {
  if (dateStr === '-') return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

const planColors: Record<string, string> = {
  Free: 'grey', Basic: 'primary', Pro: 'warning', Enterprise: 'error',
}

function getPlanColor(plan: string) {
  return planColors[plan] ?? 'secondary'
}

const roleColors: Record<string, string> = {
  admin: 'error', doctor: 'warning', nurse: 'info', receptionist: 'success', pharmacy: 'primary',
}

function getRoleColor(role: string) {
  return roleColors[role] ?? 'secondary'
}
</script>

<template>
  <div class="d-flex align-center ga-2 mb-4">
    <v-btn icon="mdi-arrow-left" variant="text" size="small" color="primary" @click="navigateTo('/super-admin/tenants')" />
    <div>
      <div class="text-h5 font-weight-bold">{{ tenant.name }}</div>
      <div class="text-caption text-medium-emphasis">Tenant details and management</div>
    </div>
  </div>

  <v-row>
    <v-col cols="12" md="7">
      <v-card elevation="0" class="rounded-md h-100">
        <v-card-item>
          <v-card-title class="text-h6 font-weight-bold">Tenant Information</v-card-title>
        </v-card-item>
        <v-divider />
        <v-card-text>
          <v-row>
            <v-col cols="12" sm="6">
              <div class="text-caption text-medium-emphasis">Name</div>
              <div class="text-body-2 font-weight-medium">{{ tenant.name }}</div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="text-caption text-medium-emphasis">Slug</div>
              <div class="text-body-2 font-weight-medium">{{ tenant.slug }}</div>
            </v-col>
            <v-col cols="12" sm="6" class="mt-2">
              <div class="text-caption text-medium-emphasis">Owner</div>
              <div class="text-body-2 font-weight-medium">{{ tenant.owner }}</div>
            </v-col>
            <v-col cols="12" sm="6" class="mt-2">
              <div class="text-caption text-medium-emphasis">Email</div>
              <div class="text-body-2 font-weight-medium">{{ tenant.owner_email }}</div>
            </v-col>
            <v-col cols="12" sm="6" class="mt-2">
              <div class="text-caption text-medium-emphasis">Phone</div>
              <div class="text-body-2 font-weight-medium">{{ tenant.owner_phone }}</div>
            </v-col>
            <v-col cols="12" sm="6" class="mt-2">
              <div class="text-caption text-medium-emphasis">Created</div>
              <div class="text-body-2 font-weight-medium">{{ formatDate(tenant.created_at) }}</div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" md="5">
      <v-card elevation="0" class="rounded-md h-100">
        <v-card-item>
          <v-card-title class="text-h6 font-weight-bold">Subscription</v-card-title>
        </v-card-item>
        <v-divider />
        <v-card-text>
          <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-caption text-medium-emphasis">Plan</span>
            <v-chip :color="getPlanColor(tenant.plan)" variant="tonal" size="small">
              {{ tenant.plan }}
            </v-chip>
          </div>
          <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-caption text-medium-emphasis">Status</span>
            <v-chip :color="tenant.status === 'active' ? 'success' : 'error'" variant="tonal" size="small">
              {{ tenant.status === 'active' ? 'Active' : 'Suspended' }}
            </v-chip>
          </div>
          <div class="d-flex align-center justify-space-between">
            <span class="text-caption text-medium-emphasis">Since</span>
            <span class="text-body-2">{{ formatDate(tenant.subscription_since) }}</span>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <v-row class="mt-2">
    <v-col cols="6" sm="3">
      <v-card elevation="0" class="rounded-md text-center pa-4">
        <div class="text-h4 font-weight-bold text-primary">{{ tenant.users }}</div>
        <div class="text-caption text-medium-emphasis">Total Users</div>
      </v-card>
    </v-col>
    <v-col cols="6" sm="3">
      <v-card elevation="0" class="rounded-md text-center pa-4">
        <div class="text-h4 font-weight-bold text-warning">{{ tenant.doctors }}</div>
        <div class="text-caption text-medium-emphasis">Doctors</div>
      </v-card>
    </v-col>
    <v-col cols="6" sm="3">
      <v-card elevation="0" class="rounded-md text-center pa-4">
        <div class="text-h4 font-weight-bold text-info">{{ tenant.patients }}</div>
        <div class="text-caption text-medium-emphasis">Patients</div>
      </v-card>
    </v-col>
    <v-col cols="6" sm="3">
      <v-card elevation="0" class="rounded-md text-center pa-4">
        <div class="text-h4 font-weight-bold text-success">{{ tenant.appointments }}</div>
        <div class="text-caption text-medium-emphasis">Appointments</div>
      </v-card>
    </v-col>
  </v-row>

  <v-card elevation="0" class="rounded-md mt-4">
    <v-card-item>
      <v-card-title class="text-h6 font-weight-bold">Users</v-card-title>
    </v-card-item>
    <v-divider />
    <v-table hover density="comfortable">
      <thead class="bg-containerBg">
        <tr>
          <th class="text-left text-caption font-weight-bold text-uppercase">User</th>
          <th class="text-left text-caption font-weight-bold text-uppercase">Role</th>
          <th class="text-left text-caption font-weight-bold text-uppercase">Status</th>
          <th class="text-left text-caption font-weight-bold text-uppercase">Joined</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="users.length === 0">
          <td colspan="4" class="text-center py-6 text-medium-emphasis">
            <v-icon icon="mdi-account-off" size="28" class="mb-1 d-block mx-auto" />
            No users found
          </td>
        </tr>
        <tr v-else v-for="user in users" :key="user.id">
          <td class="py-2">
            <div class="d-flex align-center ga-3">
              <v-avatar size="30" color="primary" variant="tonal">
                <span class="text-caption font-weight-bold">{{ getInitials(user.name) }}</span>
              </v-avatar>
              <div>
                <div class="text-body-2 font-weight-medium">{{ user.name }}</div>
                <div class="text-caption text-medium-emphasis">{{ user.email }}</div>
              </div>
            </div>
          </td>
          <td class="py-2">
            <v-chip :color="getRoleColor(user.role)" variant="tonal" size="x-small">
              {{ user.role }}
            </v-chip>
          </td>
          <td class="py-2">
            <v-chip :color="user.status === 'active' ? 'success' : 'error'" variant="tonal" size="x-small">
              {{ user.status === 'active' ? 'Active' : 'Inactive' }}
            </v-chip>
          </td>
          <td class="py-2 text-body-2 text-medium-emphasis">{{ formatDate(user.joined_at) }}</td>
        </tr>
      </tbody>
    </v-table>
  </v-card>
</template>
