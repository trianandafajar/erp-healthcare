<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue'
import RoleModal from './RoleModal.vue'

interface Permission {
    id: string
    name: string
    label: string
    module: string
    category?: string | null
}

interface Role {
    id: string
    name: string
    label: string
    created_at: string
    permissions: Permission[]
    user_count: number
}

const { can } = usePermission()

// fetch data
const currentPage = ref(1)
const itemsPerPage = 10

const queryParams = computed(() => ({
    page: currentPage.value,
    limit: itemsPerPage,
}))

const { data, pending, refresh } = await useFetch<{
    roles: Role[]
    total: number
    totalPages: number
}>('/api/roles', { query: queryParams })

const { data: permData } = await useFetch<{ permissions: Permission[]; grouped: Record<string, Permission[]> }>('/api/permissions')

const loading = ref(false)
const roles = computed(() => data.value?.roles ?? [])
const totalPages = computed(() => data.value?.totalPages ?? 1)
const totalRoles = computed(() => data.value?.total ?? 0)
const groupedPermissions = computed(() => permData.value?.grouped ?? {})
const moduleKeys = computed(() => Object.keys(groupedPermissions.value).sort())

watch([currentPage], () => { refresh() })

// modal
const dialog = ref(false)
const modalMode = ref<'add' | 'edit' | 'delete'>('add')
const selectedRole = ref<Role | null>(null)

function openAdd() {
    modalMode.value = 'add'
    selectedRole.value = null
    dialog.value = true
}

function openEdit(role: Role) {
    modalMode.value = 'edit'
    selectedRole.value = role
    dialog.value = true
}

function openDelete(role: Role) {
    modalMode.value = 'delete'
    selectedRole.value = role
    dialog.value = true
}

const actionLoading = computed(() => loading.value || pending.value)

async function handleSubmit(payload: any) {
    loading.value = true
    if (modalMode.value === 'add') {
        const permissionIds = payload.permissions.map((p: any) => typeof p === 'string' ? p : p.id)
        await $fetch('/api/roles', {
            method: 'POST',
            body: {
                name: payload.name,
                label: payload.label,
                permissions: permissionIds,
            }
        })
    }
    else if (modalMode.value === 'edit') {
        const permissionIds = payload.permissions.map((p: any) => typeof p === 'string' ? p : p.id)
        await $fetch('/api/roles', {
            method: 'PUT',
            body: {
                id: payload.id,
                name: payload.name,
                label: payload.label,
                permissions: permissionIds
            }
        })
    }
    else if (modalMode.value === 'delete') {
        await $fetch('/api/roles', {
            method: 'DELETE',
            body: {
                id: payload.id
            }
        })
    }
    await refreshNuxtData()
    loading.value = false
    dialog.value = false
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex flex-wrap align-center justify-space-between ga-3">
            <div class="min-w-0">
                <v-card-title class="text-h5 text-md-h3">Roles & Permissions</v-card-title>
                <v-card-subtitle class="mt-1">Manage roles and assign permissions to each role</v-card-subtitle>
            </div>
            <v-btn v-if="can('role.create')" color="primary" @click="openAdd" variant="flat" size="large"
                prepend-icon="mdi-plus" density="comfortable" class="flex-shrink-0">
                Add Role
            </v-btn>
        </div>
    </v-card-item>

    <UiTitleCard class-name="px-0 pb-0 rounded-md">
        <v-divider />

        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Role</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Identifier</th>
                    <th class="text-no-wrap text-center text-caption font-weight-bold text-uppercase" style="width: 80px">Users</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Permissions</th>
                    <th class="text-no-wrap text-right text-caption font-weight-bold text-uppercase" style="width: 100px">Actions
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending" v-for="i in 5" :key="i">
                    <td colspan="5" style="border-bottom: none;">
                        <v-skeleton-loader type="table-row" class="my-1" />
                    </td>
                </tr>
                <tr v-else-if="roles.length === 0">
                    <td colspan="5" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-shield-off-outline" size="32" class="mb-2 d-block mx-auto" />
                        No roles found
                    </td>
                </tr>
                <tr v-else v-for="role in roles" :key="role.id">
                    <td class="py-3">
                        <div class="d-flex align-center gap-2">
                            <span class="font-weight-medium">{{ role.label }}</span>
                        </div>
                    </td>
                    <td class="py-3">
                        <v-chip variant="tonal" color="primary" size="small" class="font-mono" label>
                            {{ role.name }}
                        </v-chip>
                    </td>
                    <td class="py-3 text-center">
                        <div class="d-flex align-center justify-center gap-1 text-medium-emphasis text-body-2">
                            <v-icon icon="mdi-account-multiple-outline" size="15" />
                            {{ role.user_count }}
                        </div>
                    </td>

                    <td class="py-3">
                        <div v-if="role.permissions.length === 0" class="text-medium-emphasis text-caption font-italic">
                            No permissions
                        </div>
                        <div v-else class="d-flex flex-wrap gap-1">
                            <v-chip v-for="perm in role.permissions.slice(0, 3)" :key="perm.id" size="x-small" label
                                variant="tonal">
                                {{ perm.name }}
                            </v-chip>
                            <v-chip v-if="role.permissions.length > 3" size="x-small" variant="tonal" color="success"
                                label>
                                +{{ role.permissions.length - 3 }} more
                            </v-chip>
                        </div>
                    </td>
                    <td class="py-3 text-right">
                        <v-btn v-if="can('role.edit')" @click="openEdit(role)" icon="mdi-pencil-outline" variant="text"
                            size="small" color="secondary" density="comfortable" />
                        <v-tooltip :text="role.user_count > 0 ? 'Role still in use' : 'Delete role'" location="top">
                            <template #activator="{ props }">
                                <span v-bind="props">
                                    <v-btn v-if="can('role.delete')" @click="openDelete(role)" icon="mdi-delete-outline"
                                        variant="text" size="small" color="error" density="comfortable"
                                        :disabled="role.user_count > 0" />
                                </span>
                            </template>
                        </v-tooltip>
                    </td>
                </tr>
            </tbody>
        </v-table>
        <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
                Showing {{ roles.length }} of {{ totalRoles }} roles
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

    <v-dialog v-model="dialog" max-width="700">
        <RoleModal :mode="modalMode" :role="selectedRole" :grouped-permissions="groupedPermissions"
            @submit="handleSubmit" @cancel="dialog = false" :loading="actionLoading" />
    </v-dialog>
</template>