<script setup lang="ts">
import { ref, computed } from 'vue'
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

const search = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

const { data, pending, refresh } = await useFetch<{ logos: Logo[] }>('/api/admin/landingpage/logos')

const logos = computed(() => data.value?.logos ?? [])

const filteredLogos = computed(() => {
    if (!search.value) return logos.value
    const q = search.value.toLowerCase()
    return logos.value.filter((l) => l.title.toLowerCase().includes(q))
})

const paginatedLogos = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    return filteredLogos.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() => Math.ceil(filteredLogos.value.length / itemsPerPage))

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
            await $fetch('/api/admin/landingpage/logos', {
                method: 'POST',
                body: {
                    title: payload.title,
                    image_url: payload.image_url,
                    sort_order: payload.sort_order,
                },
            })
            notify('Logo created successfully')
        } else if (modalMode.value === 'edit') {
            await $fetch(`/api/admin/landingpage/logos/${payload.id}`, {
                method: 'PATCH',
                body: {
                    title: payload.title,
                    image_url: payload.image_url,
                    sort_order: payload.sort_order,
                },
            })
            notify('Logo updated successfully')
        } else if (modalMode.value === 'delete') {
            await $fetch(`/api/admin/landingpage/logos/${payload.id}`, {
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
        <div class="d-flex align-center gap-3 px-4 py-3">
            <v-text-field v-model="search" placeholder="Search by title..." prepend-inner-icon="mdi-magnify"
                variant="outlined" density="compact" hide-details clearable style="max-width: 280px"
                @update:model-value="onSearch" />
        </div>

        <v-divider />

        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Logo</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Title</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Sort Order</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Active</th>
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
                <tr v-else-if="paginatedLogos.length === 0">
                    <td colspan="6" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-image-off-outline" size="32" class="mb-2 d-block mx-auto" />
                        No logos found
                    </td>
                </tr>
                <tr v-else v-for="logo in paginatedLogos" :key="logo.id">
                    <td class="py-3">
                        <v-avatar size="48" rounded="lg" color="grey-lighten-3">
                            <v-img v-if="logo.image_url" :src="logo.image_url" contain />
                            <v-icon v-else icon="mdi-image-outline" size="24" color="grey-lighten-1" />
                        </v-avatar>
                    </td>
                    <td class="py-3">
                        <span class="text-body-2 font-weight-medium">{{ logo.title }}</span>
                    </td>
                    <td class="py-3">
                        <v-chip size="small" variant="tonal" color="secondary" label>
                            {{ logo.sort_order }}
                        </v-chip>
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
                Showing {{ paginatedLogos.length }} of {{ filteredLogos.length }} logos
            </span>
            <v-pagination v-if="totalPages > 1" v-model="currentPage" :length="totalPages" :total-visible="6"
                density="compact" size="small" />
        </div>
    </UiTitleCard>

    <v-dialog v-model="dialog" max-width="540" persistent>
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
