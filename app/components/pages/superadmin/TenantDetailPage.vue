<script setup lang="ts">
import { ref, computed, watch, watchEffect } from 'vue'

const route = useRoute()
const tenantId = route.params.id as string

const activeTab = ref('overview')

const { data, pending, error } = await useFetch(`/api/superadmin/tenants/${tenantId}`)
const tenant = computed(() => data.value as any)

const { data: usersData, pending: usersPending } = await useFetch(`/api/superadmin/tenants/${tenantId}/users`)
const users = computed(() => (usersData.value as any)?.users ?? [])

function formatDate(dateStr?: string | null) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatCurrency(value?: number) {
    if (!value) return '$0'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value)
}

function getInitials(name: string) {
    return (name ?? '-').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

const planColors: Record<string, string> = { free: 'grey', basic: 'primary', pro: 'warning', enterprise: 'error' }
function getPlanColor(plan?: string) { return planColors[plan?.toLowerCase() ?? ''] ?? 'secondary' }

const roleColors: Record<string, string> = {
    admin: 'error', doctor: 'warning', nurse: 'info', receptionist: 'success', pharmacy: 'primary', patient: 'secondary',
}
function getRoleColor(role: string) { return roleColors[role] ?? 'secondary' }

const statusColors: Record<string, string> = { waiting: 'warning', in_progress: 'info', done: 'success', cancelled: 'error' }

const brandColorInput = ref(tenant.value?.brand_color || '#176D37')
const savingBrand = ref(false)
watch(() => tenant.value?.brand_color, (c) => { if (c) brandColorInput.value = c })
const previewColor = computed(() => /^#[0-9a-fA-F]{6}$/.test(brandColorInput.value) ? brandColorInput.value : '#176D37')
const savedColor = computed(() => tenant.value?.brand_color || '#176D37')

const displayNameInput = ref(tenant.value?.settings?.display_name ?? '')
watch(() => tenant.value?.settings?.display_name, (n) => { displayNameInput.value = n ?? '' })

const logoFile = ref<File | null>(null)
const logoPreview = ref(tenant.value?.settings?.logo_url ?? '')
const uploadingLogo = ref(false)
const logoError = ref('')
const logoInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

watch(() => tenant.value?.settings?.logo_url, (url) => { if (url && !logoFile.value) logoPreview.value = url })

function validateFile(file: File): string | null {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) return 'Only JPG, PNG, or WebP images are allowed.'
    if (file.size > 2 * 1024 * 1024) return 'Image must be smaller than 2 MB.'
    return null
}

function applyLogoFile(file: File) {
    const err = validateFile(file)
    if (err) { logoError.value = err; return }
    logoError.value = ''
    logoFile.value = file
    if (logoPreview.value.startsWith('blob:')) URL.revokeObjectURL(logoPreview.value)
    logoPreview.value = URL.createObjectURL(file)
}

function onLogoFileInputChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) applyLogoFile(file)
}
function onLogoDragOver(event: DragEvent) { event.preventDefault(); isDragging.value = true }
function onLogoDragLeave() { isDragging.value = false }
function onLogoDrop(event: DragEvent) {
    event.preventDefault()
    isDragging.value = false
    const file = event.dataTransfer?.files?.[0]
    if (file) applyLogoFile(file)
}
function removeLogo() {
    if (logoPreview.value.startsWith('blob:')) URL.revokeObjectURL(logoPreview.value)
    logoFile.value = null
    logoPreview.value = ''
    logoError.value = ''
    if (logoInputRef.value) logoInputRef.value.value = ''
}

async function uploadLogo(): Promise<string> {
    if (!logoFile.value) return logoPreview.value
    uploadingLogo.value = true
    try {
        const body = new FormData()
        body.append('file', logoFile.value)
        const result = await $fetch<{ url: string }>('/api/upload/tenant-logo', { method: 'POST', body })
        return result.url
    } finally {
        uploadingLogo.value = false
    }
}

const savingSettings = ref(false)
async function saveSettings() {
    savingSettings.value = true
    try {
        let logoUrl = tenant.value?.settings?.logo_url ?? ''
        if (logoFile.value) logoUrl = await uploadLogo()
        await $fetch(`/api/superadmin/tenants/${tenantId}/settings`, {
            method: 'PUT',
            body: { display_name: displayNameInput.value, logo_url: logoUrl || null },
        })
        await refreshNuxtData()
        logoFile.value = null
        notify('Healthcare branding updated')
    } catch (e: any) {
        notify(e?.data?.message || 'Failed to update branding', 'error')
    } finally {
        savingSettings.value = false
    }
}

async function saveBrandColor() {
    if (!/^#[0-9a-fA-F]{6}$/.test(brandColorInput.value)) return
    savingBrand.value = true
    try {
        await $fetch(`/api/superadmin/tenants/${tenantId}`, { method: 'PUT', body: { brand_color: brandColorInput.value } })
        await refreshNuxtData()
        notify('Brand color updated')
    } catch (e: any) {
        notify(e?.data?.message || 'Failed to update', 'error')
    } finally {
        savingBrand.value = false
    }
}

const hasBrandingChanges = computed(() =>
    !!logoFile.value ||
    displayNameInput.value !== (tenant.value?.settings?.display_name ?? '') ||
    brandColorInput.value !== savedColor.value
)

async function saveAllBranding() {
    if (brandColorInput.value !== savedColor.value) await saveBrandColor()
    await saveSettings()
}

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
        await $fetch(`/api/superadmin/tenants/${tenantId}`, { method: 'PUT', body: { subscription_status: newStatus } })
        await refreshNuxtData()
        notify(`Tenant ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`)
    } catch (e: any) {
        notify(e?.data?.message ?? 'Action failed', 'error')
    } finally {
        actionLoading.value = false
    }
}

const statCards = computed(() => [
    { label: 'Users', value: tenant.value?.stats?.users, color: 'primary', icon: 'mdi-account-group' },
    { label: 'Doctors', value: tenant.value?.stats?.doctors, color: 'warning', icon: 'mdi-doctor' },
    { label: 'Nurses', value: tenant.value?.stats?.nurses, color: 'info', icon: 'mdi-account-heart' },
    { label: 'Patients', value: tenant.value?.stats?.patients, color: 'success', icon: 'mdi-account-injury' },
    { label: 'Appointments', value: tenant.value?.stats?.appointments, color: 'secondary', icon: 'mdi-calendar-check' },
    { label: 'Med. Records', value: tenant.value?.stats?.medical_records, color: 'error', icon: 'mdi-folder-account' },
])

const tenantSlug = computed(() => (tenant.value as any)?.slug ?? '')
watchEffect(() => {
    if (tenantSlug.value) {
        document.cookie = `preview_tenant_slug=${tenantSlug.value}; path=/; max-age=3600; SameSite=Lax`
    }
})
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
            <div class="d-flex align-center ga-3">
                <v-btn icon="mdi-arrow-left" variant="tonal" size="small" color="primary"
                    @click="navigateTo('/super-admin/tenants')" />
                <v-avatar size="44" rounded="lg" color="primary" variant="tonal">
                    <v-img v-if="tenant?.settings?.logo_url" :src="tenant.settings.logo_url" cover />
                    <span v-else class="text-subtitle-2 font-weight-bold">{{ getInitials(tenant?.name) }}</span>
                </v-avatar>
                <div>
                    <div class="d-flex align-center ga-2">
                        <span class="text-h5 font-weight-bold">{{ tenant?.name }}</span>
                        <v-chip :color="tenant?.subscription_status === 'active' ? 'success' : 'error'" variant="tonal"
                            size="x-small">
                            {{ tenant?.subscription_status === 'active' ? 'Active' : 'Suspended' }}
                        </v-chip>
                    </div>
                    <div class="text-caption text-medium-emphasis">
                        {{ tenant?.slug }} · {{ tenant?.owner?.email ?? '-' }}
                    </div>
                </div>
            </div>

            <v-btn :color="tenant?.subscription_status === 'active' ? 'error' : 'success'" variant="tonal"
                :prepend-icon="tenant?.subscription_status === 'active' ? 'mdi-lock-outline' : 'mdi-lock-open-outline'"
                :loading="actionLoading" @click="toggleSuspend">
                {{ tenant?.subscription_status === 'active' ? 'Suspend Tenant' : 'Activate Tenant' }}
            </v-btn>
        </div>

        <v-card elevation="0" class="rounded-md mb-4">
            <v-row no-gutters>
                <v-col v-for="(stat, i) in statCards" :key="stat.label" cols="6" sm="4" md="2" class="pa-4 text-center"
                    :class="i < statCards.length - 1 ? 'border-e' : ''">
                    <v-icon :icon="stat.icon" :color="stat.color" size="22" class="mb-1" />
                    <div class="text-h6 font-weight-bold" :class="`text-${stat.color}`">{{ stat.value ?? 0 }}</div>
                    <div class="text-caption text-medium-emphasis">{{ stat.label }}</div>
                </v-col>
            </v-row>
        </v-card>

        <v-card elevation="0" class="rounded-md">
            <v-tabs v-model="activeTab" color="primary" class="px-2">
                <v-tab value="overview" prepend-icon="mdi-view-dashboard-outline">Overview</v-tab>
                <v-tab value="branding" prepend-icon="mdi-palette-outline">Branding</v-tab>
                <v-tab value="users" prepend-icon="mdi-account-group-outline">
                    Users
                    <v-chip size="x-small" class="ml-2" variant="tonal">{{ users.length }}</v-chip>
                </v-tab>
                <v-tab value="activity" prepend-icon="mdi-history">Activity</v-tab>
            </v-tabs>
            <v-divider />

            <v-window v-model="activeTab">
                <v-window-item value="overview" class="pa-4">
                    <v-row>
                        <v-col cols="12" md="6">
                            <v-card elevation="0" variant="outlined" class="rounded-md h-100">
                                <v-card-item>
                                    <v-card-title class="text-subtitle-1 font-weight-bold">Tenant
                                        Information</v-card-title>
                                </v-card-item>
                                <v-divider />
                                <v-card-text>
                                    <v-row dense>
                                        <v-col cols="6">
                                            <div class="text-caption text-medium-emphasis">Owner</div>
                                            <div class="text-body-2 font-weight-medium">{{ tenant?.owner?.full_name ??
                                                '-' }}</div>
                                        </v-col>
                                        <v-col cols="6">
                                            <div class="text-caption text-medium-emphasis">Owner Status</div>
                                            <v-chip :color="tenant?.owner?.status === 'active' ? 'success' : 'error'"
                                                variant="tonal" size="x-small">{{ tenant?.owner?.status ?? '-'
                                                }}</v-chip>
                                        </v-col>
                                        <v-col cols="6" class="mt-3">
                                            <div class="text-caption text-medium-emphasis">Created</div>
                                            <div class="text-body-2 font-weight-medium">{{
                                                formatDate(tenant?.created_at) }}</div>
                                        </v-col>
                                        <v-col cols="6" class="mt-3">
                                            <div class="text-caption text-medium-emphasis">Slug</div>
                                            <v-chip size="x-small" variant="tonal" color="secondary" label>{{
                                                tenant?.slug }}</v-chip>
                                        </v-col>
                                    </v-row>
                                </v-card-text>
                            </v-card>
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-card elevation="0" variant="outlined" class="rounded-md h-100">
                                <v-card-item>
                                    <v-card-title class="text-subtitle-1 font-weight-bold">Subscription</v-card-title>
                                </v-card-item>
                                <v-divider />
                                <v-card-text>
                                    <div class="d-flex align-center justify-space-between mb-2">
                                        <span class="text-caption text-medium-emphasis">Plan</span>
                                        <v-chip :color="getPlanColor(tenant?.subscription_plan)" variant="tonal"
                                            size="small">
                                            {{ tenant?.subscription_plan ?? '-' }}
                                        </v-chip>
                                    </div>
                                    <div class="d-flex align-center justify-space-between mb-2">
                                        <span class="text-caption text-medium-emphasis">Next Billing</span>
                                        <span class="text-body-2 font-weight-medium">{{
                                            formatDate(tenant?.subscription?.next_billing) }}</span>
                                    </div>
                                    <div class="d-flex align-center justify-space-between mb-2">
                                        <span class="text-caption text-medium-emphasis">Trial Ends</span>
                                        <span class="text-body-2 font-weight-medium">{{
                                            formatDate(tenant?.subscription?.trial_ends) }}</span>
                                    </div>
                                    <v-divider class="my-3" />
                                    <div class="d-flex align-center justify-space-between mb-2">
                                        <span class="text-caption text-medium-emphasis">Total Revenue</span>
                                        <span class="text-body-2 font-weight-bold text-success">{{
                                            formatCurrency(tenant?.stats?.total_revenue) }}</span>
                                    </div>
                                    <div class="d-flex align-center justify-space-between">
                                        <span class="text-caption text-medium-emphasis">Pending Revenue</span>
                                        <span class="text-body-2 font-weight-medium text-warning">{{
                                            formatCurrency(tenant?.stats?.pending_revenue) }}</span>
                                    </div>
                                </v-card-text>
                            </v-card>
                        </v-col>

                        <v-col cols="12" md="4">
                            <v-card elevation="0" variant="outlined" class="rounded-md h-100">
                                <v-card-item>
                                    <v-card-title class="text-subtitle-1 font-weight-bold">Appointment
                                        Breakdown</v-card-title>
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
                            <v-card elevation="0" variant="outlined" class="rounded-md h-100">
                                <v-card-item>
                                    <v-card-title class="text-subtitle-1 font-weight-bold">Recent
                                        Appointments</v-card-title>
                                </v-card-item>
                                <v-divider />
                                <v-table density="comfortable">
                                    <thead class="bg-containerBg">
                                        <tr>
                                            <th class="text-left text-caption font-weight-bold text-uppercase">Patient
                                            </th>
                                            <th class="text-left text-caption font-weight-bold text-uppercase">Doctor
                                            </th>
                                            <th class="text-left text-caption font-weight-bold text-uppercase">Date</th>
                                            <th class="text-left text-caption font-weight-bold text-uppercase">Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-if="!tenant?.recent_appointments?.length">
                                            <td colspan="4" class="text-center py-6 text-medium-emphasis">No
                                                appointments yet</td>
                                        </tr>
                                        <tr v-else v-for="appt in tenant.recent_appointments" :key="appt.id">
                                            <td class="py-2">
                                                <div class="text-body-2 font-weight-medium">{{ appt.patient_name }}
                                                </div>
                                                <div class="text-caption text-medium-emphasis">{{
                                                    appt.medical_record_number }}</div>
                                            </td>
                                            <td class="py-2 text-body-2 text-medium-emphasis">{{ appt.doctor_name }}
                                            </td>
                                            <td class="py-2 text-body-2 text-medium-emphasis">{{ formatDate(appt.date)
                                                }}</td>
                                            <td class="py-2">
                                                <v-chip :color="statusColors[appt.status] ?? 'secondary'"
                                                    variant="tonal" size="x-small" class="text-capitalize">
                                                    {{ appt.status?.replace('_', ' ') }}
                                                </v-chip>
                                            </td>
                                        </tr>
                                    </tbody>
                                </v-table>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-window-item>

                <v-window-item value="branding" class="pa-4">
                    <v-row>
                        <v-col cols="12" md="7">
                            <v-card elevation="0" variant="outlined" class="rounded-md h-100">
                                <v-card-item>
                                    <v-card-title class="text-subtitle-1 font-weight-bold">Display Name &
                                        Logo</v-card-title>
                                    <v-card-subtitle>How the tenant's app appears to their staff and
                                        patients</v-card-subtitle>
                                </v-card-item>
                                <v-divider />
                                <v-card-text>
                                    <v-label class="text-caption font-weight-medium mb-1">Display Name</v-label>
                                    <v-text-field v-model="displayNameInput" placeholder="e.g. My Hospital"
                                        variant="outlined" density="compact" hide-details class="mb-4" />

                                    <v-label class="text-caption font-weight-medium mb-1">Logo</v-label>
                                    <div class="d-flex ga-3 align-stretch">
                                        <v-avatar size="72" rounded="lg" color="grey-lighten-3" class="flex-shrink-0">
                                            <v-img v-if="logoPreview" :src="logoPreview" cover />
                                            <v-icon v-else icon="mdi-hospital-building-outline" size="36"
                                                color="grey-lighten-1" />
                                        </v-avatar>

                                        <div class="photo-dropzone flex-grow-1 d-flex flex-column align-center justify-center ga-1 rounded-lg"
                                            style="min-height: 72px; height: 72px;"
                                            :class="{ 'photo-dropzone--dragging': isDragging, 'photo-dropzone--error': !!logoError }"
                                            @dragover="onLogoDragOver" @dragleave="onLogoDragLeave" @drop="onLogoDrop"
                                            @click="logoInputRef?.click()">
                                            <v-icon
                                                :icon="isDragging ? 'mdi-cloud-download-outline' : 'mdi-image-plus-outline'"
                                                size="22" :color="isDragging ? 'primary' : 'grey'" />
                                            <span class="text-caption font-weight-medium">
                                                {{ isDragging ? 'Drop to upload' : 'Click or drag & drop' }}
                                            </span>
                                            <span class="text-caption text-medium-emphasis">JPG, PNG, WebP · Max 2
                                                MB</span>
                                        </div>

                                        <input ref="logoInputRef" type="file" accept="image/jpeg,image/png,image/webp"
                                            style="display: none" @change="onLogoFileInputChange" />
                                    </div>

                                    <div v-if="logoError" class="text-caption text-error mt-2 d-flex align-center ga-1">
                                        <v-icon icon="mdi-alert-circle-outline" size="14" />
                                        {{ logoError }}
                                    </div>
                                    <v-btn v-if="logoPreview" variant="text" color="error" size="x-small"
                                        prepend-icon="mdi-delete-outline" class="mt-2" @click="removeLogo">
                                        Remove image
                                    </v-btn>
                                </v-card-text>
                            </v-card>
                        </v-col>

                        <v-col cols="12" md="5">
                            <v-card elevation="0" variant="outlined" class="rounded-md h-100">
                                <v-card-item>
                                    <v-card-title class="text-subtitle-1 font-weight-bold">Brand Color</v-card-title>
                                    <v-card-subtitle>Primary accent color used across the tenant's app</v-card-subtitle>
                                </v-card-item>
                                <v-divider />
                                <v-card-text>
                                    <div class="d-flex align-center ga-4 mb-4">
                                        <div class="rounded-lg d-flex align-center justify-center"
                                            :style="{ backgroundColor: previewColor, width: '56px', height: '56px', borderRadius: '12px', border: '2px solid #e0e0e0' }">
                                        </div>
                                        <div>
                                            <div class="text-body-2 font-weight-medium">Preview</div>
                                            <div class="text-caption text-medium-emphasis"
                                                style="font-family: monospace;">{{ previewColor }}</div>
                                            <v-chip v-if="previewColor === '#176D37'" size="x-small" color="grey"
                                                variant="tonal" class="mt-1">Default</v-chip>
                                        </div>
                                    </div>
                                    <div class="d-flex align-center ga-2">
                                        <input type="color" v-model="brandColorInput"
                                            style="width: 40px; height: 40px; border: 2px solid #e0e0e0; border-radius: 8px; cursor: pointer; padding: 2px; background: none;" />
                                        <v-text-field v-model="brandColorInput" variant="outlined" density="compact"
                                            hide-details placeholder="#176D37" class="flex-grow-1" />
                                        <v-btn variant="tonal" color="grey" size="small"
                                            @click="brandColorInput = '#176D37'"
                                            :disabled="brandColorInput === '#176D37'">
                                            Reset
                                        </v-btn>
                                    </div>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>

                    <div class="d-flex justify-end mt-4">
                        <v-btn variant="flat" color="primary" size="small"
                            :loading="savingSettings || savingBrand || uploadingLogo"
                            :disabled="!hasBrandingChanges || savingSettings || savingBrand || uploadingLogo"
                            @click="saveAllBranding">
                            <v-icon start icon="mdi-content-save" size="16" />
                            Save Branding
                        </v-btn>
                    </div>
                </v-window-item>

                <v-window-item value="users">
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
                                            <span class="text-caption font-weight-bold">{{ getInitials(user.full_name ??
                                                '-') }}</span>
                                        </v-avatar>
                                        <div>
                                            <div class="text-body-2 font-weight-medium">{{ user.full_name }}</div>
                                            <div class="text-caption text-medium-emphasis">{{ user.email }}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-2">
                                    <v-chip :color="getRoleColor(user.role)" variant="tonal" size="x-small">{{ user.role
                                        }}</v-chip>
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
                </v-window-item>

                <v-window-item value="activity">
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
                                    <v-chip size="x-small" variant="tonal" color="secondary" label>{{ log.module
                                        }}</v-chip>
                                </td>
                                <td class="py-2 text-body-2 text-medium-emphasis">{{ log.actor_name }}</td>
                                <td class="py-2 text-body-2 text-medium-emphasis">{{ formatDate(log.created_at) }}</td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-window-item>
            </v-window>
        </v-card>
    </template>

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" timeout="3000">
        {{ snackbarMsg }}
        <template #actions>
            <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
        </template>
    </v-snackbar>
</template>

<style scoped>
.photo-dropzone {
    border: 2px dashed rgba(var(--v-border-color), 0.4);
    cursor: pointer;
    transition: border-color 0.2s, background-color 0.2s;
    text-align: center;
    overflow: hidden;
}

.photo-dropzone:hover {
    border-color: rgb(var(--v-theme-primary));
    background-color: rgba(var(--v-theme-primary), 0.04);
}

.photo-dropzone--dragging {
    border-color: rgb(var(--v-theme-primary));
    background-color: rgba(var(--v-theme-primary), 0.08);
}

.photo-dropzone--error {
    border-color: rgb(var(--v-theme-error));
}
</style>
