<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue'
import IndustryModal from './IndustryModal.vue'

definePageMeta({
    middleware: ['auth'],
})

interface Industry {
    id: string
    slug: string
    title: string
    description: string
    image_url: string
    sort_order: number
    is_active: boolean
    created_at: string
}

const { can } = usePermission()

const { data, pending, refresh } = await useFetch<{
    industries: Industry[]
}>('/api/superadmin/landingpage/industries')

const industries = ref<Industry[]>([])

watch(data, (val) => {
    if (val?.industries) {
        industries.value = [...val.industries].sort((a, b) => a.sort_order - b.sort_order)
    }
}, { immediate: true })

const tbodyRef = ref<HTMLElement | null>(null)

async function handleReorder(items: Industry[]) {
    const updates = items.map((item, i) => ({ id: item.id, sort_order: i }))
    for (const u of updates) {
        try {
            await $fetch(`/api/superadmin/landingpage/industries/${u.id}`, {
                method: 'PATCH',
                body: { sort_order: u.sort_order },
            })
        } catch {
            // silent
        }
    }
}

useSortableTable(tbodyRef, industries, handleReorder)

function formatDate(dateStr?: string) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
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
            const maxSort = Math.max(...industries.value.map(i => i.sort_order), -1)
            await $fetch('/api/superadmin/landingpage/industries', {
                method: 'POST',
                body: {
                    title: payload.title,
                    description: payload.description,
                    image_url: payload.image_url,
                    sort_order: maxSort + 1,
                    slug: payload.slug
                }
            })
            notify('Industry created successfully')
        } else if (modalMode.value === 'edit') {
            await $fetch(`/api/superadmin/landingpage/industries/${payload.id}`, {
                method: 'PATCH',
                body: {
                    title: payload.title,
                    description: payload.description,
                    image_url: payload.image_url,
                    slug: payload.slug
                }
            })
            notify('Industry updated successfully')
        } else if (modalMode.value === 'delete') {
            await $fetch(`/api/superadmin/landingpage/industries/${payload.id}`, {
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
                <v-card-title class="text-h3">Articles</v-card-title>
                <v-card-subtitle class="mt-1">Manage healthcare articles displayed on the landing
                    page</v-card-subtitle>
            </div>
            <v-btn v-if="can('landingpage.industries.create')" color="primary" variant="flat" size="large"
                prepend-icon="mdi-plus" density="comfortable" @click="openAdd">
                Add Article
            </v-btn>
        </div>
    </v-card-item>

    <UiTitleCard class-name="px-0 pb-0 rounded-md">
        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th style="width:36px" class="text-left text-caption font-weight-bold text-uppercase"></th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Title</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Description</th>
                    <th class="text-center text-caption font-weight-bold text-uppercase">Active</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Created</th>
                    <th class="text-right text-caption font-weight-bold text-uppercase">Actions</th>
                </tr>
            </thead>
            <tbody ref="tbodyRef">
                <tr v-if="pending" v-for="i in 5" :key="i">
                    <td colspan="6" style="border-bottom: none;">
                        <v-skeleton-loader type="table-row" class="my-1" />
                    </td>
                </tr>
                <tr v-else-if="industries.length === 0">
                    <td colspan="6" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-domain-off-outline" size="32" class="mb-2 d-block mx-auto" />
                        No industries found
                    </td>
                </tr>
                <tr v-else v-for="industry in industries" :key="industry.id">
                    <td class="py-3 drag-handle text-center" style="cursor:grab">
                        <v-icon icon="mdi-drag" size="18" color="text-medium-emphasis" />
                    </td>
                    <td class="py-3">
                        <div class="d-flex flex-column">
                            <span class="text-body-2 font-weight-medium">{{ industry.title }}</span>
                            <span class="text-caption text-medium-emphasis">/{{ industry.slug }}</span>
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
                    <td class="py-3 text-center">
                        <v-chip :color="industry.is_active ? 'success' : 'error'" size="small" variant="tonal" label>
                            {{ industry.is_active ? 'Published' : 'Draft' }}
                        </v-chip>
                    </td>
                    <td class="py-3 text-body-2 text-medium-emphasis">
                        {{ formatDate(industry.created_at) }}
                    </td>
                    <td class="py-3 text-right">
                        <v-btn v-if="can('landingpage.industries.edit')" @click="openEdit(industry)"
                            icon="mdi-pencil-outline" variant="text" size="small" color="secondary"
                            density="comfortable" title="Edit" />
                        <v-btn v-if="can('landingpage.industries.edit')"
                            @click="navigateTo('/super-admin/landingpage/industries/' + industry.id + '/content')"
                            icon="mdi-file-document-edit-outline" variant="text" size="small" color="info"
                            density="comfortable" title="Edit Content" />
                        <v-btn v-if="can('landingpage.industries.delete')" @click="openDelete(industry)"
                            icon="mdi-delete-outline" variant="text" size="small" color="error" density="comfortable"
                            title="Delete" />
                    </td>
                </tr>
            </tbody>
        </v-table>

        <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
                Showing {{ industries.length }} industries
            </span>
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

<style scoped>
.sortable-ghost {
    opacity: 0.3;
    background: rgb(var(--v-theme-primary-light)) !important;
}

.sortable-drag {
    opacity: 0.9;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.drag-handle {
    cursor: grab;
}

.drag-handle:active {
    cursor: grabbing;
}
</style>
