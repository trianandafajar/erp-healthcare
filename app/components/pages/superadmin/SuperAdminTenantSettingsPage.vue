<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import SubscriptionModal from '~/components/dashboard/superadmin/SubscriptionModal.vue'
import { getContrastText } from '@/utils/color'

const route = useRoute()
const tenantId = route.params.id as string

const tab = ref('appearance')

const { data: tenantData, pending: tenantPending } = await useFetch(`/api/superadmin/tenants/${tenantId}`)
const tenant = computed(() => (tenantData.value as any) ?? {})

const brandColor = ref(tenant.value?.brand_color || '#176D37')
const saving = ref(false)
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('success')

watch(() => tenant.value?.brand_color, (color) => {
    if (color) brandColor.value = color
})

const previewColor = computed(() => {
    return /^#[0-9a-fA-F]{6}$/.test(brandColor.value) ? brandColor.value : '#176D37'
})

const originalBrandColor = computed(() => tenant.value?.brand_color || '#176D37')

async function saveBrandColor() {
    if (!/^#[0-9a-fA-F]{6}$/.test(brandColor.value)) return
    saving.value = true
    try {
        await $fetch(`/api/superadmin/tenants/${tenantId}`, {
            method: 'PUT',
            body: { brand_color: brandColor.value },
        })
        await refreshNuxtData()
        snackbarMsg.value = 'Brand color updated successfully'
        snackbarColor.value = 'success'
        snackbar.value = true
    } catch (e: any) {
        snackbarMsg.value = e?.data?.message || 'Failed to update brand color'
        snackbarColor.value = 'error'
        snackbar.value = true
    } finally {
        saving.value = false
    }
}

const presets = ['#176D37', '#1976d2', '#1565c0', '#7b1fa2', '#c62828', '#e65100', '#2e7d32', '#00838f', '#4e342e', '#37474f']

const subscription = computed(() => tenant.value?.subscription ?? null)

function formatDate(dateStr?: string | null) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
        day: 'numeric', month: 'short', year: 'numeric',
    })
}

function formatCurrency(amount?: number, currency?: string) {
    if (amount == null) return '-'
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
        minimumFractionDigits: 0,
    }).format(amount)
}

function isExpired(sub: any) {
    if (!sub) return false
    if (sub.status === 'cancelled' || sub.status === 'past_due') return true
    if (sub.next_billing && new Date(sub.next_billing) < new Date()) return true
    return false
}

function isTrialing(sub: any) {
    return sub?.status === 'trial'
}

const statusColor: Record<string, string> = {
    active: 'success',
    trial: 'info',
    cancelled: 'error',
    past_due: 'warning',
    expired: 'error',
    suspended: 'warning',
}

const planColors: Record<string, string> = { free: 'grey', starter: 'primary', basic: 'warning', professional: 'info', enterprise: 'error' }
function getPlanColor(plan?: string) { return planColors[plan?.toLowerCase() ?? ''] ?? 'secondary' }

// General settings
const settings = ref<any>(null)
const displayName = ref('')
const logoPreview = ref('')
const logoFile = ref<File | null>(null)
const uploadingLogo = ref(false)
const logoError = ref('')
const logoInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const savingSettings = ref(false)

onMounted(async () => {
    try {
        const res = await $fetch(`/api/superadmin/tenants/${tenantId}/settings`)
        if (res) {
            settings.value = res
            displayName.value = res.display_name ?? ''
            logoPreview.value = res.logo_url ?? ''
        }
    } catch {
        // no settings yet
    }
})

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

function onLogoDragOver(event: DragEvent) {
    event.preventDefault()
    isDragging.value = true
}

function onLogoDragLeave() {
    isDragging.value = false
}

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

async function saveGeneral() {
    savingSettings.value = true
    try {
        let logoUrl = logoPreview.value
        if (logoFile.value) {
            logoUrl = await uploadLogo()
        }
        const result = await $fetch(`/api/superadmin/tenants/${tenantId}/settings`, {
            method: 'PUT',
            body: {
                display_name: displayName.value,
                logo_url: logoUrl || null,
            },
        })
        settings.value = result
        logoFile.value = null
        await refreshNuxtData()
        snackbarMsg.value = 'Healthcare branding updated successfully'
        snackbarColor.value = 'success'
        snackbar.value = true
    } catch (e: any) {
        snackbarMsg.value = e?.data?.message || 'Failed to update branding'
        snackbarColor.value = 'error'
        snackbar.value = true
    } finally {
        savingSettings.value = false
    }
}

function notify(msg: string, color = 'success') {
    snackbarMsg.value = msg
    snackbarColor.value = color
    snackbar.value = true
}

// Subscription modal
const subscriptionDialog = ref(false)
const subscriptionLoading = ref(false)

const subscriptionForModal = computed(() => {
    const sub = subscription.value
    if (!sub) return null
    return {
        id: sub.id,
        tenant_id: tenantId,
        tenant_name: tenant.value?.name ?? '',
        tenant_slug: tenant.value?.slug ?? '',
        plan: sub.plan,
        status: sub.status,
        billing_cycle: sub.billing_cycle ?? 'monthly',
        amount: sub.amount,
        start_date: sub.start_date,
        next_billing: sub.next_billing ?? '',
        trial_ends: sub.trial_ends ?? null,
        payment_method: sub.payment_method ?? '',
    }
})

async function handleSubscriptionSubmit(payload: any) {
    subscriptionLoading.value = true
    try {
        await $fetch(`/api/superadmin/subscriptions/${subscription.value?.id}`, {
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
        await refreshNuxtData()
        subscriptionDialog.value = false
        notify('Subscription updated successfully')
    } catch (e: any) {
        notify(e?.message ?? 'Failed to update subscription', 'error')
    } finally {
        subscriptionLoading.value = false
    }
}
</script>

<template>
    <div v-if="tenantPending" class="d-flex justify-center py-12">
        <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else>
        <div class="d-flex align-center ga-2 mb-1">
            <v-icon icon="mdi-cog-outline" size="24" color="primary" />
            <div class="text-h5 font-weight-bold">Settings</div>
        </div>
        <div class="text-caption text-medium-emphasis mb-5">Manage {{ tenant?.name ?? 'tenant' }} preferences and appearance</div>

        <v-card elevation="0" variant="outlined" :style="{ borderColor: '#e0e0e0' }" rounded="md" class="bg-surface">
            <v-tabs v-model="tab" color="primary" class="px-4 pt-2">
                <v-tab value="appearance" class="text-none">
                    <v-icon start icon="mdi-palette" size="18" />
                    Appearance
                </v-tab>
                <v-tab value="billing" class="text-none">
                    <v-icon start icon="mdi-credit-card-outline" size="18" />
                    Billing
                </v-tab>
                <v-tab value="branding" class="text-none">
                    <v-icon start icon="mdi-label-outline" size="18" />
                    Branding
                </v-tab>
            </v-tabs>
            <v-divider />

            <v-card-text class="pa-6">
                <v-window v-model="tab">
                    <v-window-item value="appearance">
                        <div class="d-flex flex-column flex-lg-row ga-8">
                            <div class="flex-grow-1">
                                <h3 class="text-h6 font-weight-bold mb-1">Brand Color</h3>
                                <p class="text-body-2 text-medium-emphasis mb-5">
                                    Set the primary color for this tenant's dashboard.
                                </p>

                                <div class="mb-5">
                                    <v-label class="text-caption font-weight-medium mb-2">Color presets</v-label>
                                    <div class="d-flex flex-wrap ga-2">
                                        <button v-for="color in presets" :key="color" class="rounded-lg cursor-pointer"
                                            :style="{
                                                width: '36px', height: '36px', backgroundColor: color,
                                                borderRadius: '8px', border: brandColor === color ? '3px solid #333' : '2px solid #e0e0e0',
                                                cursor: 'pointer', outline: 'none',
                                            }" @click="brandColor = color" />
                                    </div>
                                </div>

                                <div>
                                    <v-label class="text-caption font-weight-medium mb-2">Custom color</v-label>
                                    <div class="d-flex align-center ga-4 mb-6">
                                        <div>
                                            <div class="d-flex align-center ga-2">
                                                <input type="color" v-model="brandColor"
                                                    style="width: 44px; height: 44px; border: 2px solid #e0e0e0; border-radius: 8px; cursor: pointer; padding: 2px; background: none; flex-shrink: 0;" />
                                                <v-text-field v-model="brandColor" variant="outlined" density="compact"
                                                    hide-details placeholder="#176D37" style="width: 140px;"
                                                    :rules="[(v: string) => /^#[0-9a-fA-F]{6}$/.test(v) || 'Invalid hex']" />
                                            </div>
                                        </div>
                                        <v-btn variant="tonal" color="grey" size="small" height="44"
                                            @click="brandColor = '#176D37'" :disabled="brandColor === '#176D37'">
                                            Reset
                                        </v-btn>
                                    </div>
                                </div>

                                <v-divider class="mb-4" />

                                <div class="d-flex align-center ga-3">
                                    <v-btn variant="flat" color="primary" :loading="saving" @click="saveBrandColor"
                                        :disabled="brandColor === originalBrandColor || saving">
                                        <v-icon start icon="mdi-content-save" size="18" />
                                        Save Changes
                                    </v-btn>
                                    <v-btn variant="tonal" color="secondary"
                                        @click="brandColor = originalBrandColor"
                                        :disabled="brandColor === originalBrandColor">
                                        Cancel
                                    </v-btn>
                                </div>
                            </div>

                            <div class="flex-shrink-0">
                                <v-card variant="outlined" class="rounded-lg" :style="{borderColor: '#e0e0e0'}" max-width="220">
                                    <v-card-item class="pb-2">
                                        <v-card-title class="text-subtitle-2 font-weight-bold">Preview</v-card-title>
                                    </v-card-item>
                                    <v-divider />
                                    <v-card-text class="d-flex flex-column align-center py-5">
                                        <div class="rounded-xl mb-3 d-flex align-center justify-center"
                                            :style="{ backgroundColor: previewColor, width: '80px', height: '80px', borderRadius: '16px' }">
                                            <v-icon icon="mdi-hospital-building" size="32" :color="getContrastText(previewColor)" />
                                        </div>
                                        <div class="text-body-2 font-weight-medium mb-1">Primary Color</div>
                                        <div class="text-caption font-mono" style="font-family: monospace;">{{ previewColor }}</div>
                                        <div class="d-flex ga-1 mt-2">
                                            <v-chip size="x-small" :color="previewColor" variant="flat"
                                                :text-color="getContrastText(previewColor)">Button</v-chip>
                                            <v-chip size="x-small" :color="previewColor" variant="tonal"
                                                :text-color="getContrastText(previewColor)">Chip</v-chip>
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </div>
                        </div>
                    </v-window-item>

                    <v-window-item value="billing">
                        <div v-if="!subscription" class="text-center py-12 text-medium-emphasis">
                            <v-icon icon="mdi-credit-card-outline" size="40" class="mb-2" />
                            <div class="text-body-1">No subscription data available</div>
                            <div class="text-caption mt-1">This tenant does not have an active subscription.</div>
                        </div>

                        <template v-else>
                            <h3 class="text-h6 font-weight-bold mb-1">Subscription Plan</h3>
                            <p class="text-body-2 text-medium-emphasis mb-5">
                                Manage this tenant's subscription and billing information.
                            </p>

                            <v-row>
                                <v-col cols="12" md="8">
                                    <v-table density="comfortable" class="rounded-lg border">
                                        <tbody>
                                            <tr>
                                                <td class="text-caption text-medium-emphasis font-weight-medium">Plan</td>
                                                <td>
                                                    <v-chip :color="getPlanColor(subscription.plan)" variant="tonal" size="small" class="text-capitalize">
                                                        {{ subscription.plan }}
                                                    </v-chip>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td class="text-caption text-medium-emphasis font-weight-medium">Status</td>
                                                <td>
                                                    <v-chip :color="statusColor[subscription.status] || 'grey'"
                                                        variant="tonal" size="x-small" class="text-capitalize">
                                                        {{ subscription.status }}
                                                    </v-chip>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td class="text-caption text-medium-emphasis font-weight-medium">Amount</td>
                                                <td class="text-body-2 font-weight-medium">
                                                    {{ formatCurrency(subscription.amount, subscription.currency) }}
                                                    <span class="text-caption text-medium-emphasis">/ {{ subscription.billing_cycle }}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td class="text-caption text-medium-emphasis font-weight-medium">Billing Cycle</td>
                                                <td class="text-body-2 text-capitalize">{{ subscription.billing_cycle }}</td>
                                            </tr>
                                            <tr>
                                                <td class="text-caption text-medium-emphasis font-weight-medium">Currency</td>
                                                <td class="text-body-2">{{ subscription.currency?.toUpperCase() ?? '-' }}</td>
                                            </tr>
                                            <tr>
                                                <td class="text-caption text-medium-emphasis font-weight-medium">Start Date</td>
                                                <td class="text-body-2">{{ formatDate(subscription.start_date) }}</td>
                                            </tr>
                                            <tr>
                                                <td class="text-caption text-medium-emphasis font-weight-medium">Trial Ends</td>
                                                <td class="text-body-2">{{ formatDate(subscription.trial_ends) }}</td>
                                            </tr>
                                            <tr>
                                                <td class="text-caption text-medium-emphasis font-weight-medium">Next Billing</td>
                                                <td class="text-body-2">
                                                    <span :class="isExpired(subscription) ? 'text-error font-weight-bold' : ''">
                                                        {{ formatDate(subscription.next_billing) }}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td class="text-caption text-medium-emphasis font-weight-medium">Payment Method</td>
                                                <td class="text-body-2">{{ subscription.payment_method || '-' }}</td>
                                            </tr>
                                        </tbody>
                                    </v-table>

                                    <div class="d-flex flex-wrap ga-3 mt-5">
                                        <v-btn variant="flat" color="primary" @click="subscriptionDialog = true">
                                            <v-icon start icon="mdi-pencil-outline" size="18" />
                                            Edit Subscription
                                        </v-btn>
                                    </div>
                                </v-col>

                                <v-col cols="12" md="4">
                                    <v-card variant="outlined" :style="{borderColor: '#e0e0e0'}" class="rounded-lg">
                                        <v-card-item class="pb-2">
                                            <v-card-title class="text-subtitle-2 font-weight-bold d-flex align-center ga-2">
                                                <v-icon icon="mdi-information-outline" size="18" color="primary" />
                                                Summary
                                            </v-card-title>
                                        </v-card-item>
                                        <v-divider />
                                        <v-card-text class="py-4">
                                            <div class="d-flex align-center justify-space-between mb-3">
                                                <span class="text-caption text-medium-emphasis">Plan</span>
                                                <v-chip :color="getPlanColor(subscription.plan)" variant="tonal" size="x-small" class="text-capitalize">
                                                    {{ subscription.plan }}
                                                </v-chip>
                                            </div>
                                            <div class="d-flex align-center justify-space-between mb-3">
                                                <span class="text-caption text-medium-emphasis">Status</span>
                                                <v-chip :color="statusColor[subscription.status] || 'grey'" variant="tonal"
                                                    size="x-small" class="text-capitalize">
                                                    {{ subscription.status }}
                                                </v-chip>
                                            </div>
                                            <v-divider class="mb-3" />
                                            <div class="d-flex align-center justify-space-between mb-2">
                                                <span class="text-caption text-medium-emphasis">Monthly Cost</span>
                                                <span class="text-body-2 font-weight-bold"
                                                    :class="isTrialing(subscription) ? 'text-success' : ''">
                                                    {{ isTrialing(subscription) ? 'Free Trial' : formatCurrency(subscription.amount, subscription.currency) }}
                                                </span>
                                            </div>
                                            <div class="d-flex align-center justify-space-between">
                                                <span class="text-caption text-medium-emphasis">Billing Cycle</span>
                                                <span class="text-body-2 font-weight-medium text-capitalize">{{ subscription.billing_cycle }}</span>
                                            </div>
                                        </v-card-text>
                                    </v-card>

                                    <v-alert v-if="isExpired(subscription)" type="warning" variant="tonal" class="mt-3">
                                        <template #title>
                                            <span class="text-body-2 font-weight-bold">Subscription Expired</span>
                                        </template>
                                        <template #text>
                                            <span class="text-caption">This tenant's subscription has ended.</span>
                                        </template>
                                    </v-alert>

                                    <v-alert v-else-if="isTrialing(subscription)" type="info" variant="tonal" class="mt-3">
                                        <template #title>
                                            <span class="text-body-2 font-weight-bold">Trial Period</span>
                                        </template>
                                        <template #text>
                                            <span class="text-caption">Trial ends on {{ formatDate(subscription.trial_ends) }}.</span>
                                        </template>
                                    </v-alert>
                                </v-col>
                            </v-row>
                        </template>
                    </v-window-item>

                    <v-window-item value="branding">
                        <div class="d-flex flex-column flex-lg-row ga-8">
                            <div class="flex-grow-1">
                                <h3 class="text-h6 font-weight-bold mb-1">Facility Branding</h3>
                                <p class="text-body-2 text-medium-emphasis mb-5">
                                    Set the display name and logo for this tenant's healthcare facility.
                                </p>

                                <div class="mb-5">
                                    <v-label class="text-caption font-weight-medium mb-2">Display Name</v-label>
                                    <v-text-field v-model="displayName" placeholder="e.g. My Hospital" variant="outlined"
                                        density="compact" hide-details max-width="400" />
                                </div>

                                <div class="mb-5">
                                    <v-label class="text-caption font-weight-medium mb-2">Logo</v-label>
                                    <div class="d-flex ga-3 align-stretch">
                                        <v-avatar size="80" rounded="lg" color="grey-lighten-3" class="flex-shrink-0">
                                            <v-img v-if="logoPreview" :src="logoPreview" cover />
                                            <v-icon v-else icon="mdi-hospital-building-outline" size="40"
                                                color="grey-lighten-1" />
                                        </v-avatar>

                                        <div class="photo-dropzone flex-grow-1 d-flex flex-column align-center justify-center ga-1 rounded-lg"
                                            style="min-height: 80px; height: 80px; max-width: 320px;" :class="{
                                                'photo-dropzone--dragging': isDragging,
                                                'photo-dropzone--error': !!logoError
                                            }" @dragover="onLogoDragOver" @dragleave="onLogoDragLeave" @drop="onLogoDrop"
                                            @click="logoInputRef?.click()">
                                            <v-icon
                                                :icon="isDragging ? 'mdi-cloud-download-outline' : 'mdi-image-plus-outline'"
                                                size="24" :color="isDragging ? 'primary' : 'grey'" />
                                            <span class="text-caption font-weight-medium">
                                                {{ isDragging ? 'Drop to upload' : 'Click or drag & drop' }}
                                            </span>
                                            <span class="text-caption text-medium-emphasis">
                                                JPG, PNG, WebP · Max 2 MB
                                            </span>
                                        </div>

                                        <input ref="logoInputRef" type="file" accept="image/jpeg,image/png,image/webp"
                                            style="display: none" @change="onLogoFileInputChange" />
                                    </div>

                                    <div v-if="logoError" class="text-caption text-error mt-1 d-flex align-center ga-1">
                                        <v-icon icon="mdi-alert-circle-outline" size="14" />
                                        {{ logoError }}
                                    </div>

                                    <div v-if="logoPreview" class="mt-1">
                                        <v-btn variant="text" color="error" size="x-small" prepend-icon="mdi-delete-outline"
                                            @click="removeLogo">
                                            Remove image
                                        </v-btn>
                                    </div>
                                </div>

                                <v-divider class="mb-4" />

                                <div class="d-flex align-center ga-3">
                                    <v-btn variant="flat" color="primary" :loading="savingSettings || uploadingLogo"
                                        :disabled="savingSettings || uploadingLogo" @click="saveGeneral">
                                        <v-icon start icon="mdi-content-save" size="18" />
                                        Save Changes
                                    </v-btn>
                                </div>
                            </div>

                            <div class="flex-shrink-0">
                                <v-card variant="outlined" class="rounded-lg" :style="{borderColor: '#e0e0e0'}" max-width="220">
                                    <v-card-item class="pb-2">
                                        <v-card-title class="text-subtitle-2 font-weight-bold">Preview</v-card-title>
                                    </v-card-item>
                                    <v-divider />
                                    <v-card-text class="d-flex flex-column align-center py-5">
                                        <v-avatar size="72" rounded="lg" color="grey-lighten-3" class="mb-3">
                                            <v-img v-if="logoPreview" :src="logoPreview" cover />
                                            <v-icon v-else icon="mdi-hospital-building-outline" size="36"
                                                color="grey-lighten-1" />
                                        </v-avatar>
                                        <div class="text-body-2 font-weight-medium mb-1 text-center">
                                            {{ displayName || 'Your Facility' }}
                                        </div>
                                        <div class="text-caption text-medium-emphasis text-center">
                                            Preview of how this branding will appear
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </div>
                        </div>
                    </v-window-item>
                </v-window>
            </v-card-text>
        </v-card>

        <v-dialog v-model="subscriptionDialog" max-width="540">
            <SubscriptionModal mode="edit" :subscription="subscriptionForModal" :loading="subscriptionLoading"
                @submit="handleSubscriptionSubmit" @cancel="subscriptionDialog = false" />
        </v-dialog>
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
