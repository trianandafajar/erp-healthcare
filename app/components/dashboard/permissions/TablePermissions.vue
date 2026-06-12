<script setup lang="ts">
import { ref, computed } from 'vue'
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue'
import PermissionModal from './PermissionModal.vue'

interface Permission {
    id: string
    name: string
    label: string
    module: string
    created_at?: string
}

// fetch data
const { data, pending } = await useFetch<{ permissions: Permission[]; grouped: Record<string, Permission[]> }>('/api/permissions')

const permissions = computed(() => data.value?.permissions ?? [])
const groupedPermissions = computed(() => data.value?.grouped ?? {})
const moduleKeys = computed(() => Object.keys(groupedPermissions.value).sort())

const currentPage = ref(1)
const itemsPerPage = 10

const paginatedPermissions = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    return permissions.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() => Math.ceil(permissions.value.length / itemsPerPage))

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

async function handleSubmit(payload: any) {
    if (modalMode.value === 'add') {
        await $fetch('/api/permissions', {
            method: 'POST',
            body: {
                name: payload.name,
                label: payload.label,
                module: payload.module,
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
                module: payload.module
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
            <v-btn color="primary" @click="openAdd" variant="flat" size="large" prepend-icon="mdi-plus"
                density="comfortable">
                Add Permission
            </v-btn>
        </div>
    </v-card-item>

    <div class="d-flex gap-3 mb-4">
        <v-card variant="tonal" color="primary" rounded="lg" class="pa-4 flex-1">
            <div class="text-h4 font-weight-bold">{{ permissions.length }}</div>
            <div class="text-caption text-medium-emphasis">Total Permissions</div>
        </v-card>
        <v-card variant="tonal" color="info" rounded="lg" class="pa-4 flex-1">
            <div class="text-h4 font-weight-bold">{{ moduleKeys.length }}</div>
            <div class="text-caption text-medium-emphasis">Modules</div>
        </v-card>
    </div>

    <UiTitleCard class-name="px-0 pb-0 rounded-md">
        <v-divider />

        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Permission</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Identifier</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Module</th>
                    <th class="text-right text-caption font-weight-bold text-uppercase" style="width: 100px">Actions
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending">
                    <td colspan="4" class="text-center py-8">
                        <v-progress-circular indeterminate color="primary" />
                    </td>
                </tr>
                <tr v-else-if="paginatedPermissions.length === 0">
                    <td colspan="4" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-shield-off-outline" size="32" class="mb-2 d-block mx-auto" />
                        No permissions found
                    </td>
                </tr>
                <tr v-else v-for="permission in paginatedPermissions" :key="permission.id">
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
                        <v-btn @click="openEdit(permission)" icon="mdi-pencil-outline" variant="text" size="small"
                            color="secondary" density="comfortable" />
                        <v-btn @click="openDelete(permission)" icon="mdi-delete-outline" variant="text" size="small"
                            color="error" density="comfortable" />
                    </td>
                </tr>
            </tbody>
        </v-table>
        <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
                Showing {{ paginatedPermissions.length }} of {{ permissions.length }} permissions
            </span>
            <v-pagination v-if="totalPages > 1" v-model="currentPage" :length="totalPages" density="compact"
                size="small" />
        </div>
    </UiTitleCard>

    <v-dialog v-model="dialog" max-width="500" persistent>
        <PermissionModal :mode="modalMode" :permission="selectedPermission" :module-keys="moduleKeys"
            @submit="handleSubmit" @cancel="dialog = false" />
    </v-dialog>
</template>