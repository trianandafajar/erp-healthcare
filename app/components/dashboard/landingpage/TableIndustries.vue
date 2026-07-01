<script setup lang="ts">
import { ref, computed } from 'vue'
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue'
import IndustryModal from './IndustryModal.vue'

definePageMeta({
    middleware: ['auth'],
})

interface Industry {
    id: string
    title: string
    description: string
    image_url: string
    sort_order: number
    is_active: boolean
    created_at: string
}

const { can } = usePermission()

const search = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

const { data, pending } = await useFetch<{ industries: Industry[] }>('/api/admin/landingpage/industries')

const industries = computed(() => data.value?.industries ?? [])

const filteredIndustries = computed(() => {
    return industries.value.filter((d) =>
        d.title.toLowerCase().includes(search.value.toLowerCase())
    )
})

const paginatedIndustries = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    return filteredIndustries.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() => Math.ceil(filteredIndustries.value.length / itemsPerPage))

function formatDate(dateStr?: string) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
}

function onSearch() {
    currentPage.value = 1
}

const dialog = ref(false)
const modalMode = ref<'add' | 'edit' | 'delete'>('add')
const selectedIndustry = ref<Industry | null>(null)
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
    selectedIndustry.value = null
    dialog.value = true
}

function openEdit(industry: Industry) {
    modalMode.value = 'edit'
    selectedIndustry.value = industry
    dialog.value = true
}

function openDelete(industry: Industry) {
    modalMode.value = 'delete'
    selectedIndustry.value = industry
    dialog.value = true
}

function closeModal() {
    dialog.value = false
    selectedIndustry.value = null
}

async function handleSubmit(payload: any) {
    loading.value = true
    try {
        if (modalMode.value === 'add') {
            await $fetch('/api/admin/landingpage/industries', {
                method: 'POST',
                body: {
                    title: payload.title,
                    description: payload.description,
                    image_url: payload.image_url,
                    sort_order: payload.sort_order,
                }
            })
            notify('Industry created successfully')
        } else if (modalMode.value === 'edit') {
            await $fetch(`/api/admin/landingpage/industries/${payload.id}`, {
                method: 'PATCH',
                body: {
                    title: payload.title,
                    description: payload.description,
                    image_url: payload.image_url,
                    sort_order: payload.sort_order,
                }
            })
            notify('Industry updated successfully')
        } else if (modalMode.value === 'delete') {
            await $fetch(`/api/admin/landingpage/industries/${payload.id}`, {
                method: 'DELETE',
            })
            notify('Industry deleted successfully')
        }

        await refreshNuxtData()
        closeModal()
    } catch (e: any) {
        notify(e?.data?.message ?? 'Something went wrong', 'error')
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex justify-space-between align-center">
            <div>
                <v-card-title class="text-h3">Industries</v-card-title>
                <v-card-subtitle class="mt-1">Manage healthcare industries displayed on the landing
                    page</v-card-subtitle>
            </div>
            <v-btn v-if="can('landingpage.industries.create')" color="primary" variant="flat" size="large"
                prepend-icon="mdi-plus" density="comfortable" @click="openAdd">
                Add Industry
            </v-btn>
        </div>
    </v-card-item>

    <UiTitleCard class-name="px-0 pb-0 rounded-md">
        <div class="d-flex align-center justify-space-between gap-3 px-4 py-3 flex-wrap">
            <v-text-field v-model="search" placeholder="Search by title..." prepend-inner-icon="mdi-magnify"
                variant="outlined" density="compact" hide-details clearable style="max-width: 280px"
                @update:model-value="onSearch" />
        </div>

        <v-divider />

        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Title</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Description</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Sort Order</th>
                    <th class="text-center text-caption font-weight-bold text-uppercase">Active</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Created</th>
                    <th class="text-right text-caption font-weight-bold text-uppercase">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending">
                    <td colspan="6" class="text-center py-8">
                        <v-progress-circular indeterminate color="primary" />
                    </td>
                </tr>
                <tr v-else-if="paginatedIndustries.length === 0">
                    <td colspan="6" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-domain-off-outline" size="32" class="mb-2 d-block mx-auto" />
                        No industries found
                    </td>
                </tr>
                <tr v-else v-for="industry in paginatedIndustries" :key="industry.id">
                    <td class="py-3">
                        <div class="d-flex align-center ga-2">
                            <v-avatar size="32" rounded="4">
                                <v-img :src="industry.image_url" :alt="industry.title" />
                            </v-avatar>
                            <span class="text-body-2 font-weight-medium">{{ industry.title }}</span>
                        </div>
                    </td>
                    <td class="py-3">
                        <v-tooltip v-if="industry.description && industry.description.length > 60" location="top">
                            <template #activator="{ props }">
                                <span v-bind="props" class="text-body-2 text-medium-emphasis cursor-pointer">
                                    {{ industry.description.slice(0, 60) }}...
                                </span>
                            </template>
                            {{ industry.description }}
                        </v-tooltip>
                        <span v-else class="text-body-2 text-medium-emphasis">
                            {{ industry.description }}
                        </span>
                    </td>
                    <td class="py-3">
                        <v-chip size="small" variant="tonal" color="secondary" label>
                            {{ industry.sort_order }}
                        </v-chip>
                    </td>
                    <td class="py-3 text-center">
                        <v-icon :icon="industry.is_active ? 'mdi-check-circle' : 'mdi-close-circle'"
                            :color="industry.is_active ? 'success' : 'error'" size="20" />
                    </td>
                    <td class="py-3 text-body-2 text-medium-emphasis">
                        {{ formatDate(industry.created_at) }}
                    </td>
                    <td class="py-3 text-right">
                        <v-btn v-if="can('landingpage.industries.edit')" @click="openEdit(industry)"
                            icon="mdi-pencil-outline" variant="text" size="small" color="secondary"
                            density="comfortable" />
                        <v-btn v-if="can('landingpage.industries.delete')" @click="openDelete(industry)"
                            icon="mdi-delete-outline" variant="text" size="small" color="error" density="comfortable" />
                    </td>
                </tr>
            </tbody>
        </v-table>

        <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
                Showing {{ paginatedIndustries.length }} of {{ filteredIndustries.length }} industries
            </span>
            <v-pagination v-if="totalPages > 1" v-model="currentPage" :length="totalPages" :total-visible="6"
                density="compact" size="small" />
        </div>
    </UiTitleCard>

    <v-dialog v-model="dialog" max-width="600" persistent>
        <IndustryModal :mode="modalMode" :industry="selectedIndustry" :loading="actionLoading" @submit="handleSubmit"
            @cancel="closeModal" />
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" timeout="3000">
        {{ snackbarMsg }}
        <template #actions>
            <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
        </template>
    </v-snackbar>
</template>
