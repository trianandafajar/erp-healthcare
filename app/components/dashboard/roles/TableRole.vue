<script setup lang="ts">
import { ref, computed } from 'vue'
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue'

interface Permission {
    id: string
    name: string
    label: string
    module: string
}

interface Role {
    id: string
    name: string
    label: string
    created_at: string
    permissions: Permission[]
    user_count: number
}

// fetch data
const { data, pending } = await useFetch<{ roles: Role[] }>('/api/roles')
const { data: permData } = await useFetch<{ permissions: Permission[]; grouped: Record<string, Permission[]> }>('/api/permissions')

const roles = computed(() => data.value?.roles ?? [])
const groupedPermissions = computed(() => permData.value?.grouped ?? {})
const moduleKeys = computed(() => Object.keys(groupedPermissions.value).sort())

const currentPage = ref(1)
const itemsPerPage = 10

const paginatedRoles = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    return roles.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() => Math.ceil(roles.value.length / itemsPerPage))
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex justify-space-between align-center">
            <div>
                <v-card-title class="text-h3">Roles & Permissions</v-card-title>
                <v-card-subtitle class="mt-1">Manage roles and assign permissions to each role</v-card-subtitle>
            </div>
            <v-btn color="primary" variant="flat" size="large" prepend-icon="mdi-plus" density="comfortable">
                Add Role
            </v-btn>
        </div>
    </v-card-item>

    <div class="d-flex gap-3 mb-4">
        <v-card variant="tonal" color="primary" rounded="lg" class="pa-4 flex-1">
            <div class="text-h4 font-weight-bold">{{ roles.length }}</div>
            <div class="text-caption text-medium-emphasis">Total Roles</div>
        </v-card>
        <v-card variant="tonal" color="success" rounded="lg" class="pa-4 flex-1">
            <div class="text-h4 font-weight-bold">{{ permData?.permissions?.length ?? 0 }}</div>
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
                    <th class="text-left text-caption font-weight-bold text-uppercase">Role</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Identifier</th>
                    <th class="text-center text-caption font-weight-bold text-uppercase" style="width: 80px">Users</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Permissions</th>
                    <th class="text-right text-caption font-weight-bold text-uppercase" style="width: 100px">Actions
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending">
                    <td colspan="5" class="text-center py-8">
                        <v-progress-circular indeterminate color="primary" />
                    </td>
                </tr>
                <tr v-else-if="paginatedRoles.length === 0">
                    <td colspan="5" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-shield-off-outline" size="32" class="mb-2 d-block mx-auto" />
                        No roles found
                    </td>
                </tr>
                <tr v-else v-for="role in paginatedRoles" :key="role.id">
                    <td class="py-3">
                        <div class="d-flex align-center gap-2">
                            <span class="font-weight-medium">{{ role.label }}</span>
                        </div>
                    </td>
                    <td class="py-3">
                        <v-chip variant="tonal" color="primary" size="small" class="font-mono">
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
                            <v-chip v-for="perm in role.permissions.slice(0, 3)" :key="perm.id" size="x-small"
                                variant="tonal">
                                {{ perm.name }}
                            </v-chip>
                            <v-chip v-if="role.permissions.length > 3" size="x-small" variant="tonal" color="success">
                                +{{ role.permissions.length - 3 }} more
                            </v-chip>
                        </div>
                    </td>
                    <td class="py-3 text-right">
                        <v-btn icon="mdi-pencil-outline" variant="text" size="small" color="secondary"
                            density="comfortable" />
                        <v-tooltip :text="role.user_count > 0 ? 'Role still in use' : 'Delete role'" location="top">
                            <template #activator="{ props }">
                                <span v-bind="props">
                                    <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error"
                                        density="comfortable" :disabled="role.user_count > 0" />
                                </span>
                            </template>
                        </v-tooltip>
                    </td>
                </tr>
            </tbody>
        </v-table>
        <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
                Showing {{ paginatedRoles.length }} of {{ roles.length }} roles
            </span>
            <v-pagination v-if="totalPages > 1" v-model="currentPage" :length="totalPages" density="compact"
                size="small" />
        </div>
    </UiTitleCard>
</template>