<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue'
import PermissionModal from './PermissionModal.vue'

interface Permission {
    id: string
    name: string
    label: string
    module: string
    category: string
    created_at?: string
}

const { can } = usePermission()

// fetch data (paginated for table)
const currentPage = ref(1)
const itemsPerPage = 10

const queryParams = computed(() => ({
    page: currentPage.value,
    limit: itemsPerPage,
}))

const { data, pending, refresh } = await useFetch<{
    permissions: Permission[]
    total: number
    totalPages: number
    grouped: Record<string, Permission[]>
}>('/api/permissions', { query: queryParams })

// fetch all permissions for modal (no pagination)
const { data: allPermData } = await useFetch<{ permissions: Permission[]; grouped: Record<string, Permission[]> }>('/api/permissions')

const permissions = computed(() => data.value?.permissions ?? [])
const totalPages = computed(() => data.value?.totalPages ?? 1)
const totalPermissions = computed(() => data.value?.total ?? 0)
const groupedPermissions = computed(() => allPermData.value?.grouped ?? {})
const moduleKeys = computed(() => Object.keys(groupedPermissions.value).sort())

const loading = ref(false)

watch([currentPage], () => { refresh() })

// modal
const dialog = ref(false)
const modalMode = ref<'add' | 'edit' | 'delete'>('add')
const selectedPermission = ref<Permission | null>(null)

function openAdd() {
    modalMode.value = 'add'
    selectedPermission.value = null
    dialog.value = true
}

function openEdit(permission: Permission) {
    modalMode.value = 'edit'
    selectedPermission.value = permission
    dialog.value = true
}

function openDelete(permission: Permission) {
    modalMode.value = 'delete'
    selectedPermission.value = permission
    dialog.value = true
}

const actionLoading = computed(() => loading.value || pending.value)

async function handleSubmit(payload: any) {

    loading.value = true
    if (modalMode.value === 'add') {
        await $fetch('/api/permissions', {
            method: 'POST',
            body: {
                name: payload.name,
                label: payload.label,
                module: payload.module,
                category: payload.category
            }
        })
    }
    else if (modalMode.value === 'edit') {
        await $fetch('/api/permissions', {
            method: 'PUT',
            body: {
                id: payload.id,
                name: payload.name,
                label: payload.label,
                module: payload.module,
                category: payload.category
            }
        })
    }
    else if (modalMode.value === 'delete') {
        await $fetch('/api/permissions', {
            method: 'DELETE',
            body: {
                id: payload.id
            }
        })
    }
    loading.value = false
    await refreshNuxtData()
    dialog.value = false
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex justify-space-between align-center">
            <div>
                <v-card-title class="text-h3">Permissions</v-card-title>
                <v-card-subtitle class="mt-1">Manage available permissions grouped by module</v-card-subtitle>
            </div>
            <v-btn v-if="can('permission.create')" color="primary" @click="openAdd" variant="flat" size="large"
                prepend-icon="mdi-plus" density="comfortable">
                Add Permission
            </v-btn>

        </div>
    </v-card-item>

    <UiTitleCard class-name="px-0 pb-0 rounded-md">
        <v-divider />

        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Permission</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Identifier</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Module</th>
                    <th class="text-no-wrap text-right text-caption font-weight-bold text-uppercase" style="width: 100px">Actions
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending" v-for="i in 5" :key="i">
                    <td colspan="4" style="border-bottom: none;">
                        <v-skeleton-loader type="table-row" class="my-1" />
                    </td>
                </tr>
                <tr v-else-if="permissions.length === 0">
                    <td colspan="4" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-shield-off-outline" size="32" class="mb-2 d-block mx-auto" />
                        No permissions found
                    </td>
                </tr>
                <tr v-else v-for="permission in permissions" :key="permission.id">
                    <td class="py-3">
                        <span class="font-weight-medium">{{ permission.label }}</span>
                    </td>
                    <td class="py-3">
                        <v-chip variant="tonal" color="primary" size="small" class="font-mono" label>
                            {{ permission.name }}
                        </v-chip>
                    </td>
                    <td class="py-3">
                        <v-chip variant="tonal" color="secondary" size="small" class="text-capitalize" label>
                            {{ permission.module }}
                        </v-chip>
                    </td>
                    <td class="py-3 text-right">
                        <v-btn v-if="can('permission.edit')" @click="openEdit(permission)" icon="mdi-pencil-outline"
                            variant="text" size="small" color="secondary" density="comfortable" />
                        <v-btn v-if="can('permission.delete')" @click="openDelete(permission)" icon="mdi-delete-outline"
                            variant="text" size="small" color="error" density="comfortable" />
                    </td>
                </tr>
            </tbody>
        </v-table>
        <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
                Showing {{ permissions.length }} of {{ totalPermissions }} permissions
            </span>
            <v-pagination 
                v-if="totalPages > 1" 
                v-model="currentPage"        
                :total-visible="6" 
                :length="totalPages" 
                density="compact"
                size="small" 
            />
        </div>
    </UiTitleCard>

    <v-dialog v-model="dialog" max-width="500" persistent>
        <PermissionModal :mode="modalMode" :permission="selectedPermission" :module-keys="moduleKeys"
            @submit="handleSubmit" @cancel="dialog = false" :loading="actionLoading" />
    </v-dialog>
</template>