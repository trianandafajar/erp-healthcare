<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue';
import ReceptionistModal from './ReceptionistModal.vue';

const { can } = usePermission()

const search = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;
const loading = ref(false)

const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('success')

function showSnackbar(msg: string, color = 'success') {
    snackbarMsg.value = msg
    snackbarColor.value = color
    snackbar.value = true
}

const queryParams = computed(() => ({
    page: currentPage.value,
    limit: itemsPerPage,
    search: search.value || undefined,
}))

const { data, pending, refresh } = await useFetch<{
    receptionists: any[]
    total: number
    totalPages: number
}>('/api/receptionists', { query: queryParams })

const receptionists = computed(() =>
    (data.value?.receptionists ?? []).map((u: any) => ({
        id: u.id,
        full_name: u.full_name ?? '-',
        email: u.email ?? '-',
        status: u.status,
        joined: u.created_at,
    }))
)

const totalPages = computed(() => data.value?.totalPages ?? 1)
const totalItems = computed(() => data.value?.total ?? 0)

watch([search, currentPage], () => { refresh() })

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function onSearch() {
    currentPage.value = 1;
}

const dialog = ref(false)
const modalMode = ref<'add' | 'edit' | 'delete'>('add')
const selectedUser = ref<any>(null)

function openAdd() {
    selectedUser.value = null
    modalMode.value = 'add'
    dialog.value = true
}

function openEdit(user: any) {
    selectedUser.value = user
    modalMode.value = 'edit'
    dialog.value = true
}

function openDelete(user: any) {
    selectedUser.value = user
    modalMode.value = 'delete'
    dialog.value = true
}

function closeModal() {
    dialog.value = false
    selectedUser.value = null
}

const actionLoading = computed(() => loading.value || pending.value)

async function handleSubmit(payload: any) {
    loading.value = true
    try {
        if (modalMode.value === 'add') {
            await $fetch('/api/receptionists', { method: 'POST', body: payload })
            showSnackbar('Receptionist created successfully')
        } else if (modalMode.value === 'edit') {
            await $fetch('/api/receptionists', { method: 'PUT', body: payload })
            showSnackbar('Receptionist updated successfully')
        } else if (modalMode.value === 'delete') {
            await $fetch('/api/receptionists', { method: 'DELETE', body: payload })
            showSnackbar('Receptionist removed successfully')
        }

        await refresh()
        closeModal()
    } catch (err: any) {
        showSnackbar(err?.data?.message || 'Something went wrong', 'error')
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex justify-space-between align-center">
            <div>
                <v-card-title class="text-h3">Receptionist Management</v-card-title>
                <v-card-subtitle class="mt-1">Manage receptionist staff accounts</v-card-subtitle>
            </div>
            <v-btn v-if="can('receptionist.create')" color="primary" variant="flat" size="large" prepend-icon="mdi-plus"
                density="comfortable" @click="openAdd">
                Add Receptionist
            </v-btn>
        </div>
    </v-card-item>
    <UiTitleCard class-name="px-0 pb-0 rounded-md">
        <div class="d-flex align-center justify-space-between gap-3 px-4 py-3 flex-wrap">
            <v-text-field v-model="search" placeholder="Search by name or email..." prepend-inner-icon="mdi-magnify"
                variant="outlined" density="compact" hide-details clearable style="max-width: 280px"
                @update:model-value="onSearch" />
        </div>

        <v-divider />

        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Receptionist</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Status</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Joined</th>
                    <th class="text-no-wrap text-right text-caption font-weight-bold text-uppercase">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending" v-for="i in 5" :key="i">
                    <td colspan="4" style="border-bottom: none;">
                        <v-skeleton-loader type="table-row" class="my-1" />
                    </td>
                </tr>
                <tr v-else-if="receptionists.length === 0">
                    <td colspan="4" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-account-search" size="32" class="mb-2 d-block mx-auto" />
                        No receptionists found
                    </td>
                </tr>
                <tr v-else v-for="user in receptionists" :key="user.id">
                    <td class="py-3">
                        <div class="d-flex align-center ga-3">
                            <v-avatar size="34" color="secondary" variant="tonal">
                                <span class="text-caption font-weight-bold">{{ getInitials(user.full_name) }}</span>
                            </v-avatar>
                            <div>
                                <div class="text-body-2 font-weight-medium">{{ user.full_name }}</div>
                                <div class="text-caption text-medium-emphasis">{{ user.email }}</div>
                            </div>
                        </div>
                    </td>
                    <td class="py-3">
                        <v-chip :color="user.status === 'active' ? 'success' : 'default'" variant="tonal" size="small" label>
                            {{ user.status === 'active' ? 'Active' : 'Inactive' }}
                        </v-chip>
                    </td>
                    <td class="py-3 text-body-2 text-medium-emphasis">
                        {{ formatDate(user.joined) }}
                    </td>
                    <td class="py-3 text-right">
                        <v-btn v-if="can('receptionist.edit')" icon="mdi-pencil-outline" variant="text" size="small"
                            color="secondary" density="comfortable" @click="openEdit(user)" />
                        <v-btn v-if="can('receptionist.delete')" icon="mdi-delete-outline" variant="text" size="small"
                            color="error" density="comfortable" @click="openDelete(user)" />
                    </td>
                </tr>
            </tbody>
        </v-table>

        <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
                Showing {{ receptionists.length }} of {{ totalItems }} receptionists
            </span>
            <v-pagination
                v-if="totalPages > 1"
                v-model="currentPage"
                :length="totalPages"
                :total-visible="6"
                density="compact"
                size="small"
            />
        </div>
    </UiTitleCard>
    <div class="text-xs-center">
        <v-dialog v-model="dialog" width="480" persistent>
            <ReceptionistModal :loading="actionLoading" :mode="modalMode" :user="selectedUser" @submit="handleSubmit"
                @cancel="closeModal" />
        </v-dialog>
    </div>

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" timeout="3000">
        {{ snackbarMsg }}
        <template #actions>
            <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
        </template>
    </v-snackbar>
</template>
