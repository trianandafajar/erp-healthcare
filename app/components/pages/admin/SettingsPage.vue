<script setup lang="ts">
import { useTheme } from 'vuetify'
import UpgradePlanModal from './UpgradePlanModal.vue'

const profileStore = useProfileStore()
const theme = useTheme()

const tab = ref('appearance')
const upgradeDialog = ref(false)

const brandColor = ref(profileStore.data?.tenant?.brand_color || '#176D37')
const saving = ref(false)
const portalLoading = ref(false)
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('success')

watch(() => profileStore.data?.tenant?.brand_color, (color) => {
    if (color) brandColor.value = color
})

const previewColor = computed(() => {
    return /^#[0-9a-fA-F]{6}$/.test(brandColor.value) ? brandColor.value : '#176D37'
})

async function saveBrandColor() {
    if (!/^#[0-9a-fA-F]{6}$/.test(brandColor.value)) return
    saving.value = true
    try {
        await $fetch('/api/tenant/brand-color', {
            method: 'PUT',
            body: { brand_color: brandColor.value },
        })
        profileStore.refreshProfile()
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

const subscription = computed(() => profileStore.data?.subscription)
const tenant = computed(() => profileStore.data?.tenant)

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

async function openCustomerPortal() {
    portalLoading.value = true
    try {
        const { url } = await $fetch('/api/stripe/create-portal-session', {
            method: 'POST',
            body: { tenant_id: tenant.value?.id },
        })
        if (url) window.location.href = url
    } catch (e: any) {
        snackbarMsg.value = e?.data?.message || 'Failed to open billing portal'
        snackbarColor.value = 'error'
        snackbar.value = true
    } finally {
        portalLoading.value = false
    }
}

async function renewSubscription() {
    portalLoading.value = true
    try {
        const { plans } = await $fetch('/api/landingpage/pricing')
        const currentPlan = subscription.value?.plan
        const matchedPlan = plans?.find((p: any) => p.title.toLowerCase() === currentPlan) as any
        if (!matchedPlan?.stripe_price_id) {
            snackbarMsg.value = 'Pricing plan not found. Please contact support.'
            snackbarColor.value = 'error'
            snackbar.value = true
            return
        }
        const { url } = await $fetch('/api/stripe/create-checkout', {
            method: 'POST',
            body: {
                price_id: matchedPlan.stripe_price_id,
                tenant_id: tenant.value?.id,
            },
        })
        if (url) window.location.href = url
    } catch (e: any) {
        snackbarMsg.value = e?.data?.message || 'Failed to start renewal'
        snackbarColor.value = 'error'
        snackbar.value = true
    } finally {
        portalLoading.value = false
    }
}

const statusColor: Record<string, string> = {
    active: 'success',
    trial: 'info',
    cancelled: 'error',
    past_due: 'warning',
    expired: 'error',
}

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

const route = useRoute()

onMounted(async () => {
    if (route.query.upgrade === 'true') {
        tab.value = 'billing'
        upgradeDialog.value = true
    }

    try {
        settings.value = await $fetch('/api/tenant/settings')
        if (settings.value) {
            displayName.value = settings.value.display_name ?? ''
            logoPreview.value = settings.value.logo_url ?? ''
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
        const result = await $fetch('/api/tenant/settings', {
            method: 'PUT',
            body: {
                display_name: displayName.value,
                logo_url: logoUrl || null,
            },
        })
        settings.value = result
        logoFile.value = null
        profileStore.refreshProfile()
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
</script>

<template>
    <div class="d-flex align-center ga-2 mb-1">
        <v-icon icon="mdi-cog-outline" size="24" color="primary" />
        <div class="text-h5 font-weight-bold">Settings</div>
    </div>
    <div class="text-caption text-medium-emphasis mb-5">Manage your tenant preferences and appearance</div>

    <v-card elevation="0" class="rounded-md">
        <v-tabs v-model="tab" color="primary" class="px-4 pt-2">
            <v-tab value="appearance" class="text-none">
                <v-icon start icon="mdi-palette" size="18" />
                Appearance
            </v-tab>
            <v-tab value="billing" class="text-none">
                <v-icon start icon="mdi-credit-card-outline" size="18" />
                Billing
            </v-tab>
            <v-tab value="general" class="text-none">
                <v-icon start icon="mdi-hospital-building-outline" size="18" />
                Healthcare
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
                                Set the primary color for your tenant's dashboard. This will be applied across all
                                pages.
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
                                    :style="saving || brandColor === profileStore.data?.tenant?.brand_color ? 'cursor: not-allowed; pointer-events: auto;' : ''"
                                    :disabled="brandColor === profileStore.data?.tenant?.brand_color || saving">
                                    <v-icon start icon="mdi-content-save" size="18" />
                                    Save Changes
                                </v-btn>
                                <v-btn variant="tonal" color="secondary"
                                    @click="brandColor = profileStore.data?.tenant?.brand_color || '#176D37'"
                                    :disabled="brandColor === (profileStore.data?.tenant?.brand_color || '#176D37')">
                                    Cancel
                                </v-btn>
                            </div>
                        </div>

                        <div class="flex-shrink-0">
                            <v-card variant="outlined" class="rounded-lg" max-width="220">
                                <v-card-item class="pb-2">
                                    <v-card-title class="text-subtitle-2 font-weight-bold">Preview</v-card-title>
                                </v-card-item>
                                <v-divider />
                                <v-card-text class="d-flex flex-column align-center py-5">
                                    <div class="rounded-xl mb-3 d-flex align-center justify-center"
                                        :style="{ backgroundColor: previewColor, width: '80px', height: '80px', borderRadius: '16px' }">
                                        <v-icon icon="mdi-hospital-building" size="32" color="white" />
                                    </div>
                                    <div class="text-body-2 font-weight-medium mb-1">Primary Color</div>
                                    <div class="text-caption font-mono" style="font-family: monospace;">{{ previewColor
                                    }}</div>
                                    <div class="d-flex ga-1 mt-2">
                                        <v-chip size="x-small" :color="previewColor" variant="flat">Button</v-chip>
                                        <v-chip size="x-small" :color="previewColor" variant="tonal">Chip</v-chip>
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
                        <div class="text-caption mt-1">Contact support for billing details.</div>
                    </div>

                    <template v-else>
                        <h3 class="text-h6 font-weight-bold mb-1">Subscription Plan</h3>
                        <p class="text-body-2 text-medium-emphasis mb-5">
                            Manage your subscription and billing information.
                        </p>

                        <v-row>
                            <v-col cols="12" md="8">
                                <v-table density="comfortable" class="rounded-lg border">
                                    <tbody>
                                        <tr>
                                            <td class="text-caption text-medium-emphasis font-weight-medium">Plan</td>
                                            <td class="text-body-2 font-weight-medium text-capitalize">{{
                                                subscription.plan }}</td>
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
                                            <td class="text-body-2 font-weight-medium">{{
                                                formatCurrency(subscription.amount, subscription.currency) }}
                                                <span class="text-caption text-medium-emphasis">/ {{
                                                    subscription.billing_cycle }}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="text-caption text-medium-emphasis font-weight-medium">Start Date
                                            </td>
                                            <td class="text-body-2">{{ formatDate(subscription.start_date) }}</td>
                                        </tr>
                                        <tr>
                                            <td class="text-caption text-medium-emphasis font-weight-medium">Trial Ends
                                            </td>
                                            <td class="text-body-2">{{ formatDate(subscription.trial_ends) }}</td>
                                        </tr>
                                        <tr>
                                            <td class="text-caption text-medium-emphasis font-weight-medium">Next
                                                Billing</td>
                                            <td class="text-body-2">
                                                <span
                                                    :class="isExpired(subscription) ? 'text-error font-weight-bold' : ''">
                                                    {{ formatDate(subscription.next_billing) }}
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </v-table>

                                <div class="d-flex flex-wrap ga-3 mt-5">
                                    <v-btn variant="flat" color="primary" :loading="portalLoading"
                                        :disabled="!subscription.stripe_customer_id" @click="openCustomerPortal">
                                        <v-icon start icon="mdi-credit-card-outline" size="18" />
                                        Manage Billing
                                    </v-btn>

                                    <v-btn variant="flat" color="success" @click="upgradeDialog = true">
                                        <v-icon start icon="mdi-arrow-up-bold-circle-outline" size="18" />
                                        Upgrade Plan
                                    </v-btn>

                                    <v-btn v-if="subscription.stripe_customer_id" variant="tonal" color="secondary"
                                        :loading="portalLoading" @click="openCustomerPortal">
                                        <v-icon start icon="mdi-history" size="18" />
                                        View Invoices
                                    </v-btn>

                                    <v-btn v-if="isExpired(subscription)" variant="flat" color="success"
                                        :loading="portalLoading" @click="renewSubscription">
                                        <v-icon start icon="mdi-refresh" size="18" />
                                        Renew Subscription
                                    </v-btn>
                                </div>
                            </v-col>

                            <v-col cols="12" md="4">
                                <v-card variant="outlined" class="rounded-lg">
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
                                            <span class="text-body-2 font-weight-medium text-capitalize">{{
                                                subscription.plan }}</span>
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
                                                {{ isTrialing(subscription) ? 'Free Trial' :
                                                    formatCurrency(subscription.amount, subscription.currency) }}
                                            </span>
                                        </div>
                                        <div class="d-flex align-center justify-space-between">
                                            <span class="text-caption text-medium-emphasis">Billing Cycle</span>
                                            <span class="text-body-2 font-weight-medium text-capitalize">{{
                                                subscription.billing_cycle }}</span>
                                        </div>
                                    </v-card-text>
                                </v-card>

                                <v-alert v-if="isExpired(subscription)" type="warning" variant="tonal" class="mt-3">
                                    <template #title>
                                        <span class="text-body-2 font-weight-bold">Subscription Expired</span>
                                    </template>
                                    <template #text>
                                        <span class="text-caption">Your subscription has ended. Renew to continue using
                                            all features.</span>
                                    </template>
                                </v-alert>

                                <v-alert v-else-if="isTrialing(subscription)" type="info" variant="tonal" class="mt-3">
                                    <template #title>
                                        <span class="text-body-2 font-weight-bold">Trial Period</span>
                                    </template>
                                    <template #text>
                                        <span class="text-caption">Your trial ends on {{
                                            formatDate(subscription.trial_ends) }}. Add a payment method to
                                            continue.</span>
                                    </template>
                                </v-alert>
                            </v-col>
                        </v-row>
                    </template>
                </v-window-item>

                <v-window-item value="general">
                    <div class="d-flex flex-column flex-lg-row ga-8">
                        <div class="flex-grow-1">
                            <h3 class="text-h6 font-weight-bold mb-1">Healthcare Branding</h3>
                            <p class="text-body-2 text-medium-emphasis mb-5">
                                Set the display name and logo for your healthcare facility.
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
                            <v-card variant="outlined" class="rounded-lg" max-width="220">
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
                                        Preview of how your branding will appear
                                    </div>
                                </v-card-text>
                            </v-card>
                        </div>
                    </div>
                </v-window-item>
            </v-window>
        </v-card-text>
    </v-card>

    <UpgradePlanModal v-model="upgradeDialog" />

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
