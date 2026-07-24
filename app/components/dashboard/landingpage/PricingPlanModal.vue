<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface PricingPlan {
    id: string
    title: string
    subtitle: string
    price: number
    yearly_price: number | null
    currency: string
    features: string[]
    button_label: string
    button_link: string
    is_recommended: boolean
    badge_text: string
    is_active: boolean
}

const props = defineProps<{
    mode: 'add' | 'edit' | 'delete'
    plan?: PricingPlan | null
    loading?: boolean
}>()

const emit = defineEmits<{
    (e: 'submit', data: any): void
    (e: 'cancel'): void
}>()

const form = ref({
    title: '',
    subtitle: '',
    price: 0,
    yearly_price: null as number | null,
    currency: 'USD',
    features: [] as string[],
    button_label: 'Get Started',
    button_link: '/contact',
    is_recommended: false,
    badge_text: '',
    is_active: true,
})

function addFeature() {
    form.value.features.push('')
}

function removeFeature(index: number) {
    form.value.features.splice(index, 1)
}

watch(
    () => props.plan,
    (plan) => {
        if (props.mode === 'edit' && plan) {
            form.value = {
                title: plan.title,
                subtitle: plan.subtitle,
                price: plan.price,
                yearly_price: plan.yearly_price,
                currency: plan.currency,
                features: [...(plan.features ?? [])],
                button_label: plan.button_label,
                button_link: plan.button_link,
                is_recommended: plan.is_recommended,
                badge_text: plan.badge_text,
                is_active: plan.is_active,
            }
        } else {
            form.value = {
                title: '',
                subtitle: '',
                price: 0,
                yearly_price: null,
                currency: 'USD',
                features: [''],
                button_label: 'Get Started',
                button_link: '/contact',
                is_recommended: false,
                badge_text: '',
                is_active: true,
            }
        }
    },
    { immediate: true }
)

const config = computed(() => ({
    add: {
        title: 'Add Pricing Plan',
        icon: 'mdi-currency-usd',
        confirmColor: 'primary',
        confirmLabel: 'Create Plan',
    },
    edit: {
        title: 'Edit Pricing Plan',
        icon: 'mdi-pencil-outline',
        confirmColor: 'primary',
        confirmLabel: 'Save Changes',
    },
    delete: {
        title: 'Delete Pricing Plan',
        icon: 'mdi-delete-outline',
        confirmColor: 'error',
        confirmLabel: 'Delete Plan',
    },
}[props.mode]))

async function onSubmit() {
    if (props.mode === 'delete') {
        emit('submit', { id: props.plan?.id })
        return
    }

    emit('submit', {
        id: props.plan?.id,
        title: form.value.title,
        subtitle: form.value.subtitle,
        price: form.value.price,
        yearly_price: form.value.yearly_price || null,
        currency: form.value.currency,
        features: form.value.features.filter(f => f.trim()),
        button_label: form.value.button_label,
        button_link: form.value.button_link,
        is_recommended: form.value.is_recommended,
        badge_text: form.value.badge_text,
        is_active: form.value.is_active,
    })
}
</script>

<template>
    <v-card rounded="lg" max-width="600" width="100%">
        <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
            <div class="d-flex align-center ga-2">
                <v-icon :icon="config.icon" size="20" />
                <span class="text-h6 font-weight-bold">{{ config.title }}</span>
            </div>
            <v-btn icon="mdi-close" variant="text" density="compact" @click="emit('cancel')" />
        </v-card-title>

        <v-divider />

        <template v-if="mode === 'delete'">
            <v-card-text class="pa-5">
                <div class="d-flex flex-column align-center text-center ga-3">
                    <v-avatar color="error" variant="tonal" size="56">
                        <v-icon icon="mdi-delete-outline" size="28" />
                    </v-avatar>
                    <div>
                        <p class="text-body-1 font-weight-medium">
                            Are you sure you want to delete this pricing plan?
                        </p>
                        <p class="text-body-2 text-medium-emphasis mt-1">
                            <strong>{{ plan?.title }}</strong>  will be permanently removed.
                        </p>
                    </div>
                </div>
            </v-card-text>
        </template>

        <template v-else>
            <v-card-text class="pa-4" style="max-height: 480px; overflow-y: auto;">
                <v-row dense>
                    <v-col cols="12" sm="6">
                        <v-label class="text-caption font-weight-medium mb-1">Title</v-label>
                        <v-text-field v-model="form.title" placeholder="e.g. Professional" variant="outlined"
                            density="compact" hide-details="auto" />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Subtitle</v-label>
                        <v-text-field v-model="form.subtitle" placeholder="e.g. For established healthcare providers"
                            variant="outlined" density="compact" hide-details />
                    </v-col>

                    <v-col cols="12" sm="4" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Monthly Price</v-label>
                        <v-text-field v-model.number="form.price" type="number" min="0" prefix="$"
                            variant="outlined" density="compact" hide-details
                            @keydown="e => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault() }" />
                    </v-col>

                    <v-col cols="12" sm="4" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Yearly Price</v-label>
                        <v-text-field v-model.number="form.yearly_price" type="number" min="0" prefix="$"
                            variant="outlined" density="compact" hide-details clearable
                            @keydown="e => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault() }" />
                    </v-col>

                    <v-col cols="12" sm="4" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Currency</v-label>
                        <v-select v-model="form.currency" :items="['USD', 'IDR']" variant="outlined"
                            density="compact" hide-details />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Button Label</v-label>
                        <v-text-field v-model="form.button_label" placeholder="e.g. Get Started"
                            variant="outlined" density="compact" hide-details />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Button Link</v-label>
                        <v-text-field v-model="form.button_link" placeholder="e.g. /register"
                            variant="outlined" density="compact" hide-details />
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Badge Text</v-label>
                        <v-text-field v-model="form.badge_text" placeholder="e.g. Most Popular"
                            variant="outlined" density="compact" hide-details />
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-3 d-flex align-end">
                        <v-checkbox v-model="form.is_recommended" label="Recommended plan" color="primary"
                            hide-details />
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-1 d-flex align-end">
                        <v-checkbox v-model="form.is_active" label="Active" color="primary"
                            hide-details />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <div class="d-flex align-center justify-space-between mb-2">
                            <v-label class="text-caption font-weight-medium">Features</v-label>
                            <v-btn variant="text" color="primary" size="small" prepend-icon="mdi-plus"
                                @click="addFeature">
                                Add
                            </v-btn>
                        </div>
                        <div v-for="(feature, fi) in form.features" :key="fi" class="d-flex align-center ga-2 mb-2">
                            <v-text-field v-model="form.features[fi]" :placeholder="'Feature ' + (fi + 1)"
                                variant="outlined" density="compact" hide-details />
                            <v-btn icon="mdi-close" variant="text" size="small" color="error"
                                density="comfortable" @click="removeFeature(fi)" />
                        </div>
                    </v-col>
                </v-row>
            </v-card-text>
        </template>

        <v-divider />

        <v-card-actions class="pa-4 pt-3">
            <v-spacer />
            <v-btn variant="tonal" color="secondary" :disabled="loading"
                @click="emit('cancel')">Cancel</v-btn>
            <v-btn variant="flat" :color="config.confirmColor" :loading="loading"
                :disabled="loading"
                :style="loading ? 'cursor: not-allowed; pointer-events: auto;' : ''"
                @click="onSubmit">
                {{ config.confirmLabel }}
            </v-btn>
        </v-card-actions>
    </v-card>
</template>
