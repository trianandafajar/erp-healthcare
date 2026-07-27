<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
    loading?: boolean
}>()

const emit = defineEmits<{
    (e: 'submit', data: any): void
    (e: 'cancel'): void
}>()

function generatePassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%'
    let pwd = ''
    for (let i = 0; i < 12; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return pwd
}

function slugify(text: string) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
}

const form = ref({
    tenant_name: '',
    slug: '',
    admin_full_name: '',
    admin_email: '',
    admin_password: generatePassword(),
    subscription_plan: '',
    billing_cycle: 'monthly',
})

const showPassword = ref(false)
const slugManuallyEdited = ref(false)

function onNameChange(name: string) {
    if (!slugManuallyEdited.value) {
        form.value.slug = slugify(name)
    }
}

function onSlugInput() {
    slugManuallyEdited.value = true
}

const planOptions = [
    { title: 'No plan', value: '' },
    { title: 'Free', value: 'free' },
    { title: 'Basic', value: 'basic' },
    { title: 'Pro', value: 'pro' },
    { title: 'Enterprise', value: 'enterprise' },
]

const cycleOptions = ['monthly', 'yearly']

const valid = computed(() => {
    return (
        form.value.tenant_name.trim() &&
        form.value.slug.trim() &&
        form.value.admin_full_name.trim() &&
        form.value.admin_email.trim() &&
        /.+@.+\..+/.test(form.value.admin_email.trim()) &&
        form.value.admin_password.length >= 6
    )
})

function onSubmit() {
    if (!valid.value) return
    emit('submit', {
        tenant_name: form.value.tenant_name.trim(),
        slug: form.value.slug.trim(),
        admin_full_name: form.value.admin_full_name.trim(),
        admin_email: form.value.admin_email.trim(),
        admin_password: form.value.admin_password,
        subscription_plan: form.value.subscription_plan || undefined,
        billing_cycle: form.value.subscription_plan ? form.value.billing_cycle : undefined,
    })
}

function regeneratePassword() {
    form.value.admin_password = generatePassword()
}
</script>

<template>
    <v-card rounded="lg" max-width="540" width="100%">
        <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
            <div class="d-flex align-center ga-2">
                <v-icon icon="mdi-domain-plus" size="20" />
                <span class="text-h6 font-weight-bold">Create Tenant</span>
            </div>
            <v-btn icon="mdi-close" variant="text" density="compact" @click="emit('cancel')" />
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-4" style="max-height: 520px; overflow-y: auto;">
            <v-row dense>
                <v-col cols="12">
                    <v-label class="text-caption font-weight-medium mb-1">Tenant Name <span
                            class="text-error">*</span></v-label>
                    <v-text-field v-model="form.tenant_name" placeholder="e.g. Rumah Sakit Sehat" variant="outlined"
                        density="compact" hide-details @update:model-value="onNameChange" />
                </v-col>

                <v-col cols="12" class="mt-3">
                    <v-label class="text-caption font-weight-medium mb-1">Slug <span
                            class="text-error">*</span></v-label>
                    <v-text-field v-model="form.slug" placeholder="auto-generated" variant="outlined" density="compact"
                        hide-details @update:model-value="onSlugInput" />
                </v-col>

                <v-col cols="12" class="mt-4">
                    <v-divider />
                    <div class="text-body-2 font-weight-medium mt-3 mb-1">Admin Account</div>
                </v-col>

                <v-col cols="12">
                    <v-label class="text-caption font-weight-medium mb-1">Full Name <span
                            class="text-error">*</span></v-label>
                    <v-text-field v-model="form.admin_full_name" placeholder="e.g. Dr. Andi" variant="outlined"
                        density="compact" hide-details />
                </v-col>

                <v-col cols="12" class="mt-3">
                    <v-label class="text-caption font-weight-medium mb-1">Email <span
                            class="text-error">*</span></v-label>
                    <v-text-field v-model="form.admin_email" type="email" placeholder="admin@example.com"
                        variant="outlined" density="compact" hide-details />
                </v-col>

                <v-col cols="12" class="mt-3">
                    <v-label class="text-caption font-weight-medium mb-1">Password <span
                            class="text-error">*</span></v-label>
                    <v-text-field v-model="form.admin_password" :type="showPassword ? 'text' : 'password'"
                        variant="outlined" density="compact" hide-details>
                        <template #append-inner>
                            <div class="d-flex align-center ga-1">
                                <v-btn icon variant="text" size="small" density="comfortable" class="opacity-70"
                                    @click="showPassword = !showPassword">
                                    <v-icon :icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'" size="20" />
                                </v-btn>
                                <v-btn icon variant="text" size="small" density="comfortable" class="opacity-70"
                                    @click="regeneratePassword" title="Generate new password">
                                    <v-icon icon="mdi-refresh" size="20" />
                                </v-btn>
                            </div>
                        </template>
                    </v-text-field>
                </v-col>

                <v-col cols="12" class="mt-4">
                    <v-divider />
                    <div class="text-body-2 font-weight-medium mt-3 mb-1">Subscription (Optional)</div>
                </v-col>

                <v-col cols="12" sm="6">
                    <v-label class="text-caption font-weight-medium mb-1">Plan</v-label>
                    <v-select v-model="form.subscription_plan" :items="planOptions" item-title="title"
                        item-value="value" variant="outlined" density="compact" hide-details />
                </v-col>

                <v-col cols="12" sm="6">
                    <v-label class="text-caption font-weight-medium mb-1">Billing Cycle</v-label>
                    <v-select v-model="form.billing_cycle" :items="cycleOptions" variant="outlined" density="compact"
                        hide-details :disabled="!form.subscription_plan" />
                </v-col>
            </v-row>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4 pt-3">
            <v-spacer />
            <v-btn variant="tonal" color="secondary" :disabled="loading" @click="emit('cancel')">
                Cancel
            </v-btn>
            <v-btn variant="flat" color="primary" :loading="loading" :disabled="loading || !valid"
                :style="loading ? 'cursor: not-allowed; pointer-events: auto;' : ''" @click="onSubmit">
                Create Tenant
            </v-btn>
        </v-card-actions>
    </v-card>
</template>
