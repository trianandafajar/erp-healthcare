<script setup lang="ts">
import { ref, computed } from 'vue'
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue'
import PricingPlanModal from './PricingPlanModal.vue'

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
    sort_order: number
    is_active: boolean
    created_at: string
}

const { can } = usePermission()

const search = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

const { data, pending, refresh } = await useFetch<{ plans: PricingPlan[] }>('/api/superadmin/landingpage/pricing')

const plans = computed(() => data.value?.plans ?? [])

const filteredPlans = computed(() => {
    if (!search.value) return plans.value
    const q = search.value.toLowerCase()
    return plans.value.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q)
    )
})

const paginatedPlans = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    return filteredPlans.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() => Math.ceil(filteredPlans.value.length / itemsPerPage))

const dialog = ref(false)
const modalMode = ref<'add' | 'edit' | 'delete'>('add')
const selectedPlan = ref<PricingPlan | null>(null)
const loading = ref(false)
const actionLoading = computed(() => loading.value || pending.value)

const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('success')

function notify(msg: string, color = 'success') {
    snackbarMsg.value = msg
    snackbarColor.value = color
    snackbar.value = true
}

function openAdd() {
    modalMode.value = 'add'
    selectedPlan.value = null
    dialog.value = true
}

function openEdit(plan: PricingPlan) {
    modalMode.value = 'edit'
    selectedPlan.value = plan
    dialog.value = true
}

function openDelete(plan: PricingPlan) {
    modalMode.value = 'delete'
    selectedPlan.value = plan
    dialog.value = true
}

function closeModal() {
    dialog.value = false
    selectedPlan.value = null
}

async function handleSubmit(payload: any) {
    loading.value = true
    try {
        if (modalMode.value === 'add') {
            await $fetch('/api/superadmin/landingpage/pricing', {
                method: 'POST',
                body: {
                    title: payload.title,
                    subtitle: payload.subtitle,
                    price: payload.price,
                    yearly_price: payload.yearly_price,
                    currency: payload.currency,
                    features: payload.features,
                    button_label: payload.button_label,
                    button_link: payload.button_link,
                    is_recommended: payload.is_recommended,
                    badge_text: payload.badge_text,
                    sort_order: payload.sort_order,
                },
            })
            notify('Pricing plan created successfully')
        } else if (modalMode.value === 'edit') {
            await $fetch(`/api/superadmin/landingpage/pricing/${payload.id}`, {
                method: 'PATCH',
                body: {
                    title: payload.title,
                    subtitle: payload.subtitle,
                    price: payload.price,
                    yearly_price: payload.yearly_price,
                    currency: payload.currency,
                    features: payload.features,
                    button_label: payload.button_label,
                    button_link: payload.button_link,
                    is_recommended: payload.is_recommended,
                    badge_text: payload.badge_text,
                    sort_order: payload.sort_order,
                    is_active: payload.is_active,
                },
            })
            notify('Pricing plan updated successfully')
        } else if (modalMode.value === 'delete') {
            await $fetch(`/api/superadmin/landingpage/pricing/${payload.id}`, {
                method: 'DELETE',
            })
            notify('Pricing plan deleted successfully')
        }
        await refreshNuxtData()
        closeModal()
    } catch (e: any) {
        notify(e?.data?.message ?? 'Something went wrong', 'error')
    } finally {
        loading.value = false
    }
}

function formatDate(dateStr?: string) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

function onSearch() {
    currentPage.value = 1
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex justify-space-between align-center">
            <div>
                <v-card-title class="text-h3">Pricing Plans</v-card-title>
                <v-card-subtitle class="mt-1">Manage pricing plans displayed on the landing page</v-card-subtitle>
            </div>
            <v-btn v-if="can('landingpage.pricing.create')" color="primary" variant="flat" size="large"
                prepend-icon="mdi-plus" density="comfortable" @click="openAdd">
                Add Plan
            </v-btn>
        </div>
    </v-card-item>

    <UiTitleCard class-name="px-0 pb-0 rounded-md">
        <div class="d-flex align-center gap-3 px-4 py-3">
            <v-text-field v-model="search" placeholder="Search by title..."
                prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable
                style="max-width: 280px" @update:model-value="onSearch" />
        </div>

        <v-divider />

        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Plan</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Monthly</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Yearly</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Recommended</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Active</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Sort</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Created</th>
                    <th class="text-right text-caption font-weight-bold text-uppercase">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending">
                    <td colspan="9" class="text-center py-8">
                        <v-progress-circular indeterminate color="primary" />
                    </td>
                </tr>
                <tr v-else-if="paginatedPlans.length === 0">
                    <td colspan="9" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-currency-usd-off" size="32" class="mb-2 d-block mx-auto" />
                        No pricing plans found
                    </td>
                </tr>
                <tr v-else v-for="plan in paginatedPlans" :key="plan.id">
                    <td class="py-3">
                        <div class="d-flex align-center ga-3">
                            <v-icon icon="mdi-currency-usd" color="primary" size="24" />
                            <div>
                                <div class="text-body-2 font-weight-medium">{{ plan.title }}</div>
                                <div class="text-caption text-medium-emphasis">{{ plan.subtitle }}</div>
                            </div>
                        </div>
                    </td>
                    <td class="py-3">
                        <span class="text-body-2 font-weight-medium">${{ plan.price }}</span>
                    </td>
                    <td class="py-3">
                        <span class="text-body-2 font-weight-medium">
                            {{ plan.yearly_price ? '$' + plan.yearly_price : '-' }}
                        </span>
                    </td>
                    <td class="py-3">
                        <v-chip v-if="plan.is_recommended" color="success" variant="tonal" size="small">
                            {{ plan.badge_text || 'Recommended' }}
                        </v-chip>
                        <span v-else class="text-caption text-medium-emphasis">—</span>
                    </td>
                    <td class="py-3">
                        <v-chip :color="plan.is_active ? 'success' : 'error'" variant="tonal" size="small">
                            {{ plan.is_active ? 'Active' : 'Inactive' }}
                        </v-chip>
                    </td>
                    <td class="py-3 text-body-2 text-medium-emphasis">
                        {{ plan.sort_order }}
                    </td>
                    <td class="py-3 text-body-2 text-medium-emphasis">
                        {{ formatDate(plan.created_at) }}
                    </td>
                    <td class="py-3 text-right">
                        <v-btn v-if="can('landingpage.pricing.edit')" icon="mdi-pencil-outline" variant="text"
                            size="small" color="primary" density="comfortable" @click="openEdit(plan)" />
                        <v-btn v-if="can('landingpage.pricing.delete')" icon="mdi-delete-outline" variant="text"
                            size="small" color="error" density="comfortable" @click="openDelete(plan)" />
                    </td>
                </tr>
            </tbody>
        </v-table>

        <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
                Showing {{ paginatedPlans.length }} of {{ filteredPlans.length }} plans
            </span>
            <v-pagination v-if="totalPages > 1" v-model="currentPage" :length="totalPages" :total-visible="6"
                density="compact" size="small" />
        </div>
    </UiTitleCard>

    <v-dialog v-model="dialog" max-width="600" persistent>
        <PricingPlanModal :mode="modalMode" :plan="selectedPlan" :loading="actionLoading"
            @submit="handleSubmit" @cancel="closeModal" />
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" timeout="3000">
        {{ snackbarMsg }}
        <template #actions>
            <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
        </template>
    </v-snackbar>
</template>
