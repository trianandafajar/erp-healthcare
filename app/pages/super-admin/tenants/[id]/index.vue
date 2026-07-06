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
const tenantId = route.params.id as string

const { data, pending, error } = await useFetch(`/api/superadmin/tenants/${tenantId}`)
const tenant = computed(() => data.value as any)

const { data: usersData, pending: usersPending } = await useFetch(`/api/superadmin/tenants/${tenantId}/users`)
const users = computed(() => (usersData.value as any)?.users ?? [])

function formatDate(dateStr?: string | null) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
        day: 'numeric', month: 'short', year: 'numeric',
    })
}

function formatCurrency(value?: number) {
    if (!value) return '$0'
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
    }).format(value)
}
function getInitials(name: string) {
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

const planColors: Record<string, string> = {
    free: 'grey', basic: 'primary', pro: 'warning', enterprise: 'error',
}

function getPlanColor(plan?: string) {
    return planColors[plan?.toLowerCase() ?? ''] ?? 'secondary'
}

const roleColors: Record<string, string> = {
    admin: 'error', doctor: 'warning', nurse: 'info',
    receptionist: 'success', pharmacy: 'primary', patient: 'secondary',
}

function getRoleColor(role: string) {
    return roleColors[role] ?? 'secondary'
}

const brandColorInput = ref(tenant.value?.brand_color || '#176D37')
const savingBrand = ref(false)

watch(() => tenant.value?.brand_color, (c) => {
    if (c) brandColorInput.value = c
})

const previewColor = computed(() => {
    return /^#[0-9a-fA-F]{6}$/.test(brandColorInput.value) ? brandColorInput.value : '#176D37'
})

const savedColor = computed(() => tenant.value?.brand_color || '#176D37')

async function saveBrandColor() {
    if (!/^#[0-9a-fA-F]{6}$/.test(brandColorInput.value)) return
    savingBrand.value = true
    try {
        await $fetch(`/api/superadmin/tenants/${tenantId}`, {
            method: 'PUT',
            body: { brand_color: brandColorInput.value },
        })
        await refreshNuxtData()
        notify('Brand color updated')
    } catch (e: any) {
        notify(e?.data?.message || 'Failed to update', 'error')
    } finally {
        savingBrand.value = false
    }
}

const statusColors: Record<string, string> = {
    waiting: 'warning', in_progress: 'info', done: 'success', cancelled: 'error',
}

// Suspend/activate action
const actionLoading = ref(false)
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('success')

function notify(msg: string, color = 'success') {
    snackbarMsg.value = msg
    snackbarColor.value = color
    snackbar.value = true
}

async function toggleSuspend() {
    actionLoading.value = true
    try {
        const newStatus = tenant.value?.subscription_status === 'active' ? 'suspended' : 'active'
        await $fetch(`/api/superadmin/tenants/${tenantId}`, {
            method: 'PUT',
            body: { subscription_status: newStatus }
        })
        await refreshNuxtData()
        notify(`Tenant ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`)
    } catch (e: any) {
        notify(e?.data?.message ?? 'Action failed', 'error')
    } finally {
        actionLoading.value = false
    }
}
</script>

<template>
    <div v-if="pending" class="d-flex justify-center py-12">
        <v-progress-circular indeterminate color="primary" />
    </div>

    <div v-else-if="error" class="text-center py-12 text-error">
        Failed to load tenant details.
    </div>

    <template v-else>
        <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-3">
            <div class="d-flex align-center ga-2">
                <v-btn icon="mdi-arrow-left" variant="text" size="small" color="primary"
                    @click="navigateTo('/super-admin/tenants')" />
                <div>
                    <div class="text-h5 font-weight-bold">{{ tenant?.name }}</div>
                    <div class="text-caption text-medium-emphasis">Tenant details and management</div>
                </div>
            </div>

            <v-btn :color="tenant?.subscription_status === 'active' ? 'error' : 'success'" variant="tonal"
                :prepend-icon="tenant?.subscription_status === 'active' ? 'mdi-lock-outline' : 'mdi-lock-open-outline'"
                :loading="actionLoading" @click="toggleSuspend">
                {{ tenant?.subscription_status === 'active' ? 'Suspend Tenant' : 'Activate Tenant' }}
            </v-btn>
        </div>

        <v-row>
            <v-col cols="12" md="5">
                <v-card elevation="0" class="rounded-md h-100">
                    <v-card-item>
                        <v-card-title class="text-h6 font-weight-bold">Tenant Information</v-card-title>
                    </v-card-item>
                    <v-divider />
                    <v-card-text>
                        <v-row dense>
                            <v-col cols="12" sm="6">
                                <div class="text-caption text-medium-emphasis">Name</div>
                                <div class="text-body-2 font-weight-medium">{{ tenant?.name }}</div>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <div class="text-caption text-medium-emphasis">Slug</div>
                                <v-chip size="x-small" variant="tonal" color="secondary" label>
                                    {{ tenant?.slug }}
                                </v-chip>
                            </v-col>
                            <v-col cols="12" sm="6" class="mt-3">
                                <div class="text-caption text-medium-emphasis">Owner</div>
                                <div class="text-body-2 font-weight-medium">
                                    {{ tenant?.owner?.full_name ?? '-' }}
                                </div>
                            </v-col>
                            <v-col cols="12" sm="6" class="mt-3">
                                <div class="text-caption text-medium-emphasis">Email</div>
                                <div class="text-body-2 font-weight-medium">
                                    {{ tenant?.owner?.email ?? '-' }}
                                </div>
                            </v-col>
                            <v-col cols="12" sm="6" class="mt-3">
                                <div class="text-caption text-medium-emphasis">Owner Status</div>
                                <v-chip :color="tenant?.owner?.status === 'active' ? 'success' : 'error'"
                                    variant="tonal" size="x-small">
                                    {{ tenant?.owner?.status ?? '-' }}
                                </v-chip>
                            </v-col>
                            <v-col cols="12" sm="6" class="mt-3">
                                <div class="text-caption text-medium-emphasis">Created</div>
                                <div class="text-body-2 font-weight-medium">
                                    {{ formatDate(tenant?.created_at) }}
                                </div>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="4">
                <v-card elevation="0" class="rounded-md h-100">
                    <v-card-item>
                        <v-card-title class="text-h6 font-weight-bold">Subscription</v-card-title>
                    </v-card-item>
                    <v-divider />
                    <v-card-text>
                        <div class="d-flex align-center justify-space-between mb-3">
                            <span class="text-caption text-medium-emphasis">Plan</span>
                            <v-chip :color="getPlanColor(tenant?.subscription_plan)" variant="tonal" size="small">
                                {{ tenant?.subscription_plan ?? '-' }}
                            </v-chip>
                        </div>
                        <div class="d-flex align-center justify-space-between mb-3">
                            <span class="text-caption text-medium-emphasis">Status</span>
                            <v-chip :color="tenant?.subscription_status === 'active' ? 'success' : 'error'"
                                variant="tonal" size="small">
                                {{ tenant?.subscription_status === 'active' ? 'Active' : 'Suspended' }}
                            </v-chip>
                        </div>
                        <v-divider class="mb-3" />
                        <div class="d-flex align-center justify-space-between mb-2">
                            <span class="text-caption text-medium-emphasis">Total Revenue</span>
                            <span class="text-body-2 font-weight-bold text-success">
                                {{ formatCurrency(tenant?.stats?.total_revenue) }}
                            </span>
                        </div>
                        <div class="d-flex align-center justify-space-between">
                            <span class="text-caption text-medium-emphasis">Pending Revenue</span>
                            <span class="text-body-2 font-weight-medium text-warning">
                                {{ formatCurrency(tenant?.stats?.pending_revenue) }}
                            </span>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="3">
                <v-card elevation="0" class="rounded-md h-100">
                    <v-card-item>
                        <v-card-title class="text-h6 font-weight-bold d-flex align-center gap-2">
                            <v-icon icon="mdi-palette" size="20" color="primary" />
                            Branding
                        </v-card-title>
                        <v-card-subtitle>Customize primary color</v-card-subtitle>
                    </v-card-item>
                    <v-divider />
                    <v-card-text>
                        <div class="d-flex flex-column align-center py-2">
                            <div class="d-flex align-center ga-4 mb-4">
                                <div class="rounded-lg border d-flex align-center justify-center"
                                    :style="{ backgroundColor: previewColor, width: '64px', height: '64px', borderRadius: '12px', border: '2px solid #e0e0e0' }">
                                </div>
                                <div>
                                    <div class="text-body-2 font-weight-medium">Preview</div>
                                    <div class="text-caption text-medium-emphasis mt-1" style="font-family: monospace;">
                                        {{ previewColor }}</div>
                                    <v-chip v-if="previewColor === '#176D37'" size="x-small" color="grey"
                                        variant="tonal" class="mt-1">Default</v-chip>
                                </div>
                            </div>
                            <div class="d-flex align-center ga-2 w-100 mb-3">
                                <input type="color" v-model="brandColorInput"
                                    style="width: 44px; height: 44px; border: 2px solid #e0e0e0; border-radius: 8px; cursor: pointer; padding: 2px; background: none;" />
                                <v-text-field v-model="brandColorInput" variant="outlined" density="compact"
                                    hide-details placeholder="#176D37" class="flex-grow-1" />
                            </div>
                            <div class="d-flex ga-2 w-100">
                                <v-btn variant="tonal" color="grey" size="small" @click="brandColorInput = '#176D37'"
                                    :style="brandColorInput === '#176D37' ? 'cursor: not-allowed; pointer-events: auto;' : ''"
                                    :disabled="brandColorInput === '#176D37'">
                                    Reset
                                </v-btn>
                                <v-btn variant="flat" color="primary" size="small" :loading="savingBrand"
                                    :style="savingBrand || brandColorInput === savedColor ? 'cursor: not-allowed; pointer-events: auto;' : ''"
                                    @click="saveBrandColor" class="flex-grow-1"
                                    :disabled="!/^#[0-9a-fA-F]{6}$/.test(brandColorInput) || brandColorInput === savedColor || savingBrand">
                                    <v-icon start icon="mdi-content-save" size="16" />
                                    Save
                                </v-btn>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <v-row class="mt-2">
            <v-col cols="6" sm="4" md="2" v-for="stat in [
                { label: 'Users', value: tenant?.stats?.users, color: 'primary', icon: 'mdi-account-group' },
                { label: 'Doctors', value: tenant?.stats?.doctors, color: 'warning', icon: 'mdi-doctor' },
                { label: 'Nurses', value: tenant?.stats?.nurses, color: 'info', icon: 'mdi-account-heart' },
                { label: 'Patients', value: tenant?.stats?.patients, color: 'success', icon: 'mdi-account-injury' },
                { label: 'Appointments', value: tenant?.stats?.appointments, color: 'secondary', icon: 'mdi-calendar-check' },
                { label: 'Med. Records', value: tenant?.stats?.medical_records, color: 'error', icon: 'mdi-folder-account' },
            ]" :key="stat.label">
                <v-card elevation="0" class="rounded-md text-center pa-3">
                    <v-icon :icon="stat.icon" :color="stat.color" size="24" class="mb-1" />
                    <div class="text-h5 font-weight-bold" :class="`text-${stat.color}`">{{ stat.value ?? 0 }}</div>
                    <div class="text-caption text-medium-emphasis">{{ stat.label }}</div>
                </v-card>
            </v-col>
        </v-row>

        <v-row class="mt-2">
            <v-col cols="12" md="4">
                <v-card elevation="0" class="rounded-md h-100">
                    <v-card-item>
                        <v-card-title class="text-h6 font-weight-bold">Appointment Breakdown</v-card-title>
                    </v-card-item>
                    <v-divider />
                    <v-card-text>
                        <div v-for="(val, key) in tenant?.appointment_breakdown" :key="key"
                            class="d-flex align-center justify-space-between mb-2">
                            <v-chip :color="statusColors[key] ?? 'secondary'" variant="tonal" size="x-small"
                                class="text-capitalize">
                                {{ String(key).replace('_', ' ') }}
                            </v-chip>
                            <span class="text-body-2 font-weight-medium">{{ val }}</span>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="8">
                <v-card elevation="0" class="rounded-md h-100">
                    <v-card-item>
                        <v-card-title class="text-h6 font-weight-bold">Recent Appointments</v-card-title>
                    </v-card-item>
                    <v-divider />
                    <v-table density="comfortable">
                        <thead class="bg-containerBg">
                            <tr>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Patient</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Doctor</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Date</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="!tenant?.recent_appointments?.length">
                                <td colspan="4" class="text-center py-6 text-medium-emphasis">No appointments yet</td>
                            </tr>
                            <tr v-else v-for="appt in tenant.recent_appointments" :key="appt.id">
                                <td class="py-2">
                                    <div class="text-body-2 font-weight-medium">{{ appt.patient_name }}</div>
                                    <div class="text-caption text-medium-emphasis">{{ appt.medical_record_number }}
                                    </div>
                                </td>
                                <td class="py-2 text-body-2 text-medium-emphasis">{{ appt.doctor_name }}</td>
                                <td class="py-2 text-body-2 text-medium-emphasis">{{ formatDate(appt.date) }}</td>
                                <td class="py-2">
                                    <v-chip :color="statusColors[appt.status] ?? 'secondary'" variant="tonal"
                                        size="x-small" class="text-capitalize">
                                        {{ appt.status?.replace('_', ' ') }}
                                    </v-chip>
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
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
                    <tr v-if="usersPending">
                        <td colspan="4" class="text-center py-6">
                            <v-progress-circular indeterminate color="primary" size="24" />
                        </td>
                    </tr>
                    <tr v-else-if="!users.length">
                        <td colspan="4" class="text-center py-6 text-medium-emphasis">
                            <v-icon icon="mdi-account-off" size="28" class="mb-1 d-block mx-auto" />
                            No users found
                        </td>
                    </tr>
                    <tr v-else v-for="user in users" :key="user.id">
                        <td class="py-2">
                            <div class="d-flex align-center ga-3">
                                <v-avatar size="30" color="primary" variant="tonal">
                                    <span class="text-caption font-weight-bold">
                                        {{ getInitials(user.full_name ?? '-') }}
                                    </span>
                                </v-avatar>
                                <div>
                                    <div class="text-body-2 font-weight-medium">{{ user.full_name }}</div>
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
                            <v-chip :color="user.status === 'active' ? 'success' : 'error'" variant="tonal"
                                size="x-small">
                                {{ user.status === 'active' ? 'Active' : 'Inactive' }}
                            </v-chip>
                        </td>
                        <td class="py-2 text-body-2 text-medium-emphasis">{{ formatDate(user.created_at) }}</td>
                    </tr>
                </tbody>
            </v-table>
        </v-card>

        <v-card elevation="0" class="rounded-md mt-4">
            <v-card-item>
                <v-card-title class="text-h6 font-weight-bold">Recent Activity</v-card-title>
            </v-card-item>
            <v-divider />
            <v-table density="comfortable">
                <thead class="bg-containerBg">
                    <tr>
                        <th class="text-left text-caption font-weight-bold text-uppercase">Action</th>
                        <th class="text-left text-caption font-weight-bold text-uppercase">Module</th>
                        <th class="text-left text-caption font-weight-bold text-uppercase">Actor</th>
                        <th class="text-left text-caption font-weight-bold text-uppercase">Time</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="!tenant?.recent_activity?.length">
                        <td colspan="4" class="text-center py-6 text-medium-emphasis">No activity recorded</td>
                    </tr>
                    <tr v-else v-for="log in tenant.recent_activity" :key="log.id">
                        <td class="py-2">
                            <div class="text-body-2 font-weight-medium">{{ log.action }}</div>
                            <div class="text-caption text-medium-emphasis">{{ log.description }}</div>
                        </td>
                        <td class="py-2">
                            <v-chip size="x-small" variant="tonal" color="secondary" label>
                                {{ log.module }}
                            </v-chip>
                        </td>
                        <td class="py-2 text-body-2 text-medium-emphasis">{{ log.actor_name }}</td>
                        <td class="py-2 text-body-2 text-medium-emphasis">{{ formatDate(log.created_at) }}</td>
                    </tr>
                </tbody>
            </v-table>
        </v-card>
    </template>

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" timeout="3000">
        {{ snackbarMsg }}
        <template #actions>
            <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
        </template>
    </v-snackbar>
</template>