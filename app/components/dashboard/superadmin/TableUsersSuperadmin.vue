<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue';
import UserModalSuperadmin from './UserModalSuperadmin.vue';

const search = ref('');
const selectedRole = ref('all');
const selectedTenant = ref('all');
const currentPage = ref(1);
const itemsPerPage = 10;
const loading = ref(false)

interface RoleOption {
    value: string
    label: string
}

interface TenantOption {
    id: string
    name: string
    slug: string
}

const { data: rolesData } = await useFetch<{ roles: { name: string; label?: string }[] }>('/api/roles')

const roles = computed<RoleOption[]>(() => {
    const apiRoles: RoleOption[] = (rolesData.value?.roles ?? []).map((r) => ({
        value: r.name,
        label: r.label ?? r.name
    }))
    return [{ value: 'all', label: 'All Roles' }, ...apiRoles]
})

const { data: tenantsData } = await useFetch<{ tenants: TenantOption[] }>('/api/superadmin/tenants')

const tenants = computed<TenantOption[]>(() => tenantsData.value?.tenants ?? [])

const tenantOptions = computed(() => {
    return [{ id: 'all', name: 'All Tenants', slug: '' }, ...tenants.value]
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
    role: selectedRole.value !== 'all' ? selectedRole.value : undefined,
    tenant_id: selectedTenant.value !== 'all' ? selectedTenant.value : undefined,
}))

const { data, pending, refresh } = await useFetch<{
    profiles: any[]
    total: number
    totalPages: number
}>('/api/superadmin/users', { query: queryParams })

const users = computed(() =>
    (data.value?.profiles ?? []).map((u) => ({
        id: u.id,
        name: u.full_name ?? '-',
        email: u.email ?? '-',
        role: u.role,
        status: u.status,
        joined: u.created_at,
        tenant_id: u.tenant_id,
        tenant_name: u.tenant_name,
        is_owner: u.is_owner ?? false,
    }))
)

const totalPages = computed(() => data.value?.totalPages ?? 1)
const totalUsers = computed(() => data.value?.total ?? 0)

watch([search, selectedRole, selectedTenant], () => {
    currentPage.value = 1
})

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

// modal
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

const { can } = usePermission()
const { loginAs } = useImpersonation()
const isLoggingInAs = ref<string | null>(null)

async function openLoginAs(user: any) {
    isLoggingInAs.value = user.id
    try {
        await loginAs({ id: user.id, name: user.name, role: user.role })
        showSnackbar(`Logged in as ${user.name} successfully.`)
    } catch (err: any) {
        showSnackbar(err?.data?.message || err?.message || 'Gagal masuk sebagai user ini.', 'error')
        isLoggingInAs.value = null
    }
}

const resetDialog = ref(false)
const resetUser = ref<any>(null)
const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const resetLoading = ref(false)

function openResetPassword(user: any) {
    resetUser.value = user
    newPassword.value = ''
    confirmPassword.value = ''
    showPassword.value = false
    resetDialog.value = true
}

async function handleResetPassword() {
    if (newPassword.value.length < 8) {
        showSnackbar('Password must be at least 8 characters', 'error')
        return
    }
    if (newPassword.value !== confirmPassword.value) {
        showSnackbar('Passwords do not match', 'error')
        return
    }
    resetLoading.value = true
    try {
        await $fetch('/api/superadmin/users/reset-password', {
            method: 'POST',
            body: { id: resetUser.value.id, password: newPassword.value }
        })
        showSnackbar('Password reset successfully')
        resetDialog.value = false
    } catch (err: any) {
        showSnackbar(err?.data?.message || 'Failed to reset password', 'error')
    } finally {
        resetLoading.value = false
    }
}

const actionLoading = computed(() => loading.value || pending.value)

async function handleSubmit(payload: any) {
    loading.value = true
    try {
        if (modalMode.value === 'add') {
            await $fetch('/api/superadmin/users', { method: 'POST', body: payload })
            showSnackbar('User created successfully')
        } else if (modalMode.value === 'edit') {
            await $fetch('/api/superadmin/users', { method: 'PUT', body: payload })
            showSnackbar('User updated successfully')
        } else if (modalMode.value === 'delete') {
            await $fetch('/api/superadmin/users', { method: 'DELETE', body: payload })
            showSnackbar('User removed successfully')
        }

        await refresh()
        closeModal()
    } catch (err: any) {
        showSnackbar(err?.data?.message || 'Failed', 'error')
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
                <v-card-subtitle class="mt-1">Manage users across all tenants</v-card-subtitle>
            </div>
            <v-btn color="primary" variant="flat" size="large" prepend-icon="mdi-plus" density="comfortable"
                @click="openAdd">
                Add User
            </v-btn>
        </div>
    </v-card-item>
    <UiTitleCard class-name="px-0 pb-0 rounded-md">
        <div class="d-flex align-center justify-space-between gap-3 px-4 py-3 flex-wrap">
            <v-text-field v-model="search" placeholder="Search by name or email..." prepend-inner-icon="mdi-magnify"
                variant="outlined" density="compact" hide-details clearable style="max-width: 280px" />
            <div class="d-flex align-center ga-2">
                <v-select v-model="selectedTenant" :items="tenantOptions" item-title="name" item-value="id"
                    variant="outlined" density="compact" hide-details style="max-width: 200px" />
                <v-select v-model="selectedRole" :items="roles" item-title="label" item-value="value" variant="outlined"
                    density="compact" hide-details style="max-width: 180px" />
            </div>
        </div>

        <v-divider />

        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">User</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Tenant</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Role</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Status</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Joined</th>
                    <th class="text-no-wrap text-right text-caption font-weight-bold text-uppercase">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending" v-for="i in 5" :key="i">
                    <td colspan="6" style="border-bottom: none;">
                        <v-skeleton-loader type="table-row" class="my-1" />
                    </td>
                </tr>
                <tr v-else-if="users.length === 0">
                    <td colspan="6" class="text-center py-8 text-medium-emphasis">
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
                        <v-chip size="small" variant="tonal" color="primary" label>
                            {{ user.tenant_name ?? '—' }}
                        </v-chip>
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
                        <v-btn v-if="can('user.impersonate')" icon variant="text" size="small" color="warning"
                            density="comfortable" title="Login as this user" :loading="isLoggingInAs === user.id"
                            :disabled="isLoggingInAs !== null" @click="openLoginAs(user)">
                            <v-icon icon="mdi-account-arrow-right-outline" />
                        </v-btn>
                        <v-btn icon="mdi-lock-reset" variant="text" size="small" color="info" density="comfortable"
                            title="Reset Password" @click="openResetPassword(user)" />
                        <v-btn icon="mdi-pencil-outline" variant="text" size="small" color="secondary"
                            density="comfortable" @click="openEdit(user)" />
                        <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error" density="comfortable"
                            @click="openDelete(user)" />
                    </td>
                </tr>
            </tbody>
        </v-table>

        <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
                Showing {{ users.length }} of {{ totalUsers }} users
            </span>
            <v-pagination v-if="totalPages > 1" v-model="currentPage" :length="totalPages" :total-visible="6"
                density="compact" size="small" />
        </div>
    </UiTitleCard>
    <div class="text-xs-center">
        <v-dialog v-model="dialog" width="520">
            <UserModalSuperadmin :loading="actionLoading" :mode="modalMode" :user="selectedUser" :tenants="tenants"
                @submit="handleSubmit" @cancel="closeModal" />
        </v-dialog>
    </div>

    <v-dialog v-model="resetDialog" width="420">
        <v-card rounded="lg">
            <v-card-title class="d-flex align-center pa-4 pb-2">
                <v-icon icon="mdi-lock-reset" size="20" class="mr-2" />
                <span class="text-h6 font-weight-bold">Reset Password</span>
                <v-spacer />
                <v-btn icon="mdi-close" variant="text" density="compact" @click="resetDialog = false" />
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-4">
                <div class="text-body-2 mb-4">
                    Reset password for <strong>{{ resetUser?.name }}</strong> ({{ resetUser?.email }})
                </div>
                <v-text-field v-model="newPassword" :type="showPassword ? 'text' : 'password'" label="New Password"
                    variant="outlined" density="compact" :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showPassword = !showPassword" hide-details="auto" class="mb-3" />
                <v-text-field v-model="confirmPassword" :type="showPassword ? 'text' : 'password'"
                    label="Confirm Password" variant="outlined" density="compact" hide-details="auto" />
            </v-card-text>
            <v-divider />
            <v-card-actions class="pa-4 pt-3">
                <v-spacer />
                <v-btn variant="tonal" color="secondary" @click="resetDialog = false">
                    Cancel
                </v-btn>
                <v-btn variant="flat" color="primary"
                    :style="resetLoading || !newPassword || !confirmPassword ? 'cursor: not-allowed; pointer-events: auto;' : ''"
                    :loading="resetLoading" :disabled="resetLoading || !newPassword || !confirmPassword" @click="handleResetPassword">
                    Reset Password
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" timeout="3000">
        {{ snackbarMsg }}
        <template #actions>
            <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
        </template>
    </v-snackbar>
</template>