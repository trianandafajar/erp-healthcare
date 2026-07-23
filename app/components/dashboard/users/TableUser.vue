<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue';
import UserModal from './UserModal.vue';

const { can } = usePermission()

const search = ref('');
const selectedRole = ref('all');
const currentPage = ref(1);
const itemsPerPage = 10;
const loading = ref(false)

interface RoleOption {
    value: string
    label: string
}

const { data: rolesData } = await useFetch<{ roles: { name: string; label?: string }[] }>('/api/roles')

const roles = computed<RoleOption[]>(() => {
    const apiRoles: RoleOption[] = (rolesData.value?.roles ?? []).map((r) => ({
        value: r.name,
        label: r.label ?? r.name
    }))
    return [{ value: 'all', label: 'All' }, ...apiRoles]
})

const colorPalette: string[] = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'purple', 'teal']
const roleColors = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    roles.value.forEach((r, i) => {
        if (r.value !== 'all') {
            map[r.value] = colorPalette[i % colorPalette.length] ?? 'primary'
        }
    })
    return map
})

const { loginAs } = useImpersonation()

const isLoggingInAs = ref<string | null>(null)

const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('success')

function showSnackbar(msg: string, color = 'success') {
    snackbarMsg.value = msg
    snackbarColor.value = color
    snackbar.value = true
}

async function openLoginAs(user: any) {
    isLoggingInAs.value = user.id
    try {
        await loginAs({ id: user.id, name: user.name, role: user.role })
    } catch (err: any) {
        showSnackbar(err?.data?.message || err?.message || 'Gagal masuk sebagai user ini.', 'error')
        isLoggingInAs.value = null
    }
}

let searchTimeout: NodeJS.Timeout | null = null

watch(search, () => {
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
        currentPage.value = 1
        refresh()
    }, 300)
})

watch(selectedRole, () => {
    currentPage.value = 1
    refresh()
})

watch(currentPage, () => {
    refresh()
})

const queryParams = computed(() => ({
    page: currentPage.value,
    limit: itemsPerPage,
    search: search.value || undefined,
    role: selectedRole.value !== 'all' ? selectedRole.value : undefined,
}))

const { data, pending, refresh } = await useFetch<{
    profiles: any[]
    total: number
    totalPages: number
}>('/api/users', { query: queryParams })

const allUsers = computed(() =>
    (data.value?.profiles ?? []).map((u) => ({
        id: u.id,
        name: u.full_name ?? '-',
        email: u.email ?? '-',
        role: u.role,
        status: u.status,
        joined: u.created_at,
    }))
)

const users = computed(() => {
    let result = allUsers.value

    if (selectedRole.value !== 'all') {
        result = result.filter(u => u.role === selectedRole.value)
    }

    if (search.value) {
        const q = search.value.toLowerCase()
        result = result.filter(u =>
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q)
        )
    }

    return result
})

const totalPages = computed(() => data.value?.totalPages ?? 1)
const totalUsers = computed(() => data.value?.total ?? 0)

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
            await $fetch('/api/users', { method: 'POST', body: payload })
        } else if (modalMode.value === 'edit') {
            await $fetch('/api/users', { method: 'PUT', body: payload })
        } else if (modalMode.value === 'delete') {
            await $fetch('/api/users', { method: 'DELETE', body: payload })
        }

        await refreshNuxtData()
        closeModal()
    } catch (err: any) {
        showSnackbar(err?.data?.message || 'Failed')
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex justify-space-between align-center">
            <div>
                <v-card-title class="text-h3">User Management</v-card-title>
                <v-card-subtitle class="mt-1">Manage and organize user accounts</v-card-subtitle>
            </div>
            <v-btn v-if="can('user.create')" color="primary" variant="flat" size="large" prepend-icon="mdi-plus"
                density="comfortable" @click="openAdd">
                Add User
            </v-btn>
        </div>
    </v-card-item>
    <UiTitleCard class-name="px-0 pb-0 rounded-md">
        <div class="d-flex align-center justify-space-between gap-3 px-4 py-3 flex-wrap">
            <v-text-field v-model="search" placeholder="Search by name or email..." prepend-inner-icon="mdi-magnify"
                variant="outlined" density="compact" hide-details clearable style="max-width: 280px" />
            <v-select v-model="selectedRole" :items="roles" item-title="label" item-value="value" variant="outlined"
                density="compact" hide-details style="max-width: 200px" />
        </div>

        <v-divider />

        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">User</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Role</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Status</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Joined</th>
                    <th class="text-no-wrap text-right text-caption font-weight-bold text-uppercase">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending" v-for="i in 5" :key="i">
                    <td colspan="5" style="border-bottom: none;">
                        <v-skeleton-loader type="table-row" class="my-1" />
                    </td>
                </tr>
                <tr v-else-if="users.length === 0">
                    <td colspan="5" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-account-search" size="32" class="mb-2 d-block mx-auto" />
                        No users found
                    </td>
                </tr>
                <tr v-else v-for="user in users" :key="user.id">
                    <td class="py-3">
                        <div class="d-flex align-center ga-3">
                            <v-avatar size="34" :color="roleColors[user.role]" variant="tonal">
                                <span class="text-caption font-weight-bold">{{ getInitials(user.name) }}</span>
                            </v-avatar>
                            <div>
                                <div class="text-body-2 font-weight-medium">{{ user.name }}</div>
                                <div class="text-caption text-medium-emphasis">{{ user.email }}</div>
                            </div>
                        </div>
                    </td>
                    <td class="py-3">
                        <v-chip size="small" variant="tonal" :color="roleColors[user.role]" label
                            class="text-capitalize">
                            {{ user.role }}
                        </v-chip>
                    </td>
                    <td class="py-3">
                        <v-chip :color="user.status === 'active' ? 'success' : 'default'" variant="tonal" size="small"
                            label>
                            {{ user.status === 'active' ? 'Active' : 'Inactive' }}
                        </v-chip>
                    </td>
                    <td class="py-3 text-body-2 text-medium-emphasis">
                        {{ formatDate(user.joined) }}
                    </td>
                    <td class="py-3 text-right">
                        <v-btn v-if="can('user.edit')" icon="mdi-pencil-outline" variant="text" size="small"
                            color="secondary" density="comfortable" @click="openEdit(user)" />
                        <v-btn v-if="can('user.delete')" icon="mdi-delete-outline" variant="text" size="small"
                            color="error" density="comfortable" @click="openDelete(user)" />
                        <v-btn icon variant="text" size="small" color="warning" density="comfortable"
                            title="Login as this user" :loading="isLoggingInAs === user.id"
                            :disabled="isLoggingInAs !== null" @click="openLoginAs(user)">
                            <v-icon icon="mdi-account-arrow-right-outline" />
                        </v-btn>
                    </td>
                </tr>
            </tbody>
        </v-table>

        <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
                Showing {{ users.length }} of {{ totalUsers }} users
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
            <UserModal :loading="actionLoading" :mode="modalMode" :user="selectedUser" @submit="handleSubmit"
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