<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue'
import LogoModal from './LogoModal.vue'

interface Logo {
    id: string
    title: string
    image_url: string
    sort_order: number
    is_active: boolean
    created_at: string
}

const { can } = usePermission()

const { data, pending, refresh } = await useFetch<{
    logos: Logo[]
}>('/api/superadmin/landingpage/logos')

const logos = ref<Logo[]>([])

watch(data, (val) => {
    if (val?.logos) {
        logos.value = [...val.logos].sort((a, b) => a.sort_order - b.sort_order)
    }
}, { immediate: true })

const tbodyRef = ref<HTMLElement | null>(null)

async function handleReorder(items: Logo[]) {
    const updates = items.map((item, i) => ({ id: item.id, sort_order: i }))
    for (const u of updates) {
        try {
            await $fetch(`/api/superadmin/landingpage/logos/${u.id}`, {
                method: 'PATCH',
                body: { sort_order: u.sort_order },
            })
        } catch {
            // silent
        }
    }
}

useSortableTable(tbodyRef, logos, handleReorder)

function formatDate(dateStr?: string) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

const dialog = ref(false)
const modalMode = ref<'add' | 'edit' | 'delete'>('add')
const selectedLogo = ref<Logo | null>(null)
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
    selectedLogo.value = null
    dialog.value = true
}

function openEdit(logo: Logo) {
    modalMode.value = 'edit'
    selectedLogo.value = logo
    dialog.value = true
}

function openDelete(logo: Logo) {
    modalMode.value = 'delete'
    selectedLogo.value = logo
    dialog.value = true
}

function closeModal() {
    dialog.value = false
    selectedLogo.value = null
}

async function handleSubmit(payload: any) {
    loading.value = true
    try {
        if (modalMode.value === 'add') {
            const maxSort = Math.max(...logos.value.map(l => l.sort_order), -1)
            await $fetch('/api/superadmin/landingpage/logos', {
                method: 'POST',
                body: {
                    title: payload.title,
                    image_url: payload.image_url,
                    sort_order: maxSort + 1,
                    is_active: payload.is_active ?? true,
                },
            })
            notify('Logo created successfully')
        } else if (modalMode.value === 'edit') {
            await $fetch(`/api/superadmin/landingpage/logos/${payload.id}`, {
                method: 'PATCH',
                body: {
                    title: payload.title,
                    image_url: payload.image_url,
                    is_active: payload.is_active ?? true,
                },
            })
            notify('Logo updated successfully')
        } else if (modalMode.value === 'delete') {
            await $fetch(`/api/superadmin/landingpage/logos/${payload.id}`, {
                method: 'DELETE',
            })
            notify('Logo deleted successfully')
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
                <v-card-title class="text-h3">Sponsors Management</v-card-title>
                <v-card-subtitle class="mt-1">Manage client logos displayed on the landing page</v-card-subtitle>
            </div>
            <v-btn v-if="can('landingpage.logos.create')" color="primary" variant="flat" size="large"
                prepend-icon="mdi-plus" density="comfortable" @click="openAdd">
                Add Logo
            </v-btn>
        </div>
    </v-card-item>

    <UiTitleCard class-name="px-0 pb-0 rounded-md">
        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th style="width:36px" class="text-left text-caption font-weight-bold text-uppercase"></th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Logo</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Title</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Active</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Created</th>
                    <th class="text-no-wrap text-right text-caption font-weight-bold text-uppercase">Actions</th>
                </tr>
            </thead>
            <tbody ref="tbodyRef">
                <tr v-if="pending" v-for="i in 5" :key="i">
                    <td colspan="6" style="border-bottom: none;">
                        <v-skeleton-loader type="table-row" class="my-1" />
                    </td>
                </tr>
                <tr v-else-if="logos.length === 0">
                    <td colspan="6" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-image-off-outline" size="32" class="mb-2 d-block mx-auto" />
                        No logos found
                    </td>
                </tr>
                <tr v-else v-for="logo in logos" :key="logo.id">
                    <td class="py-3 drag-handle text-center" style="cursor:grab">
                        <v-icon icon="mdi-drag" size="18" color="text-medium-emphasis" />
                    </td>
                    <td class="py-3">
                        <img v-if="logo.image_url" :src="logo.image_url" :alt="logo.title"
                            class="logo-thumb" />
                        <v-avatar v-else size="48" color="grey-lighten-3">
                            <v-icon icon="mdi-image-outline" size="24" color="grey-lighten-1" />
                        </v-avatar>
                    </td>
                    <td class="py-3">
                        <span class="text-body-2 font-weight-medium">{{ logo.title }}</span>
                    </td>
                    <td class="py-3">
                        <v-icon v-if="logo.is_active" icon="mdi-check-circle" color="success" size="20" />
                        <v-icon v-else icon="mdi-cancel" color="error" size="20" />
                    </td>
                    <td class="py-3 text-body-2 text-medium-emphasis">
                        {{ formatDate(logo.created_at) }}
                    </td>
                    <td class="py-3 text-right">
                        <v-btn v-if="can('landingpage.logos.edit')" icon="mdi-pencil-outline" variant="text"
                            size="small" color="primary" density="comfortable" @click="openEdit(logo)" />
                        <v-btn v-if="can('landingpage.logos.delete')" icon="mdi-delete-outline" variant="text"
                            size="small" color="error" density="comfortable" @click="openDelete(logo)" />
                    </td>
                </tr>
            </tbody>
        </v-table>

        <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
                Showing {{ logos.length }} logos
            </span>
        </div>
    </UiTitleCard>

    <v-dialog v-model="dialog" max-width="540">
        <LogoModal :mode="modalMode" :logo="selectedLogo" :loading="actionLoading" @submit="handleSubmit"
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

.logo-thumb {
    height: 48px;
    width: auto;
    object-fit: contain;
    max-width: 120px;
}
</style>
