<script setup lang="ts">
import { computed, ref, watch } from 'vue'

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

const props = defineProps<{
    mode: 'add' | 'edit' | 'delete'
    role?: Role | null
    groupedPermissions?: Record<string, Permission[]>
    loading: boolean
}>()

const emit = defineEmits<{
    (e: 'submit', data: any): void
    (e: 'cancel'): void
}>()

const form = ref({
    name: '',
    label: '',
    permissions: [] as string[],
})

watch(
    () => props.role,
    (role) => {
        if (role && props.mode === 'edit') {
            form.value = {
                name: role.name,
                label: role.label,
                permissions: role.permissions.map(
                    p => p.id
                )
            }
        }
    },
    { immediate: true }
)

const config = computed(() => ({
    add: {
        title: 'Add new Role',
        icon: 'mdi-shield-plus-outline',
        confirmColor: 'primary',
        confirmLabel: 'Create Role',
    },
    edit: {
        title: 'Edit Role',
        icon: 'mdi-shield-edit-outline',
        confirmColor: 'primary',
        confirmLabel: 'Save Changes',
    },
    delete: {
        title: 'Delete Role',
        icon: 'mdi-delete-outline',
        confirmColor: 'error',
        confirmLabel: 'Delete Role',
    },
}[props.mode]))

const categoryFilter = ref<string | null>(null)
const filterMenu = ref(false)

const categoryOptions = [
    { title: 'All Categories', value: null },
    { title: 'Admin', value: 'admin' },
    { title: 'Doctor', value: 'doctor' },
    { title: 'Nurse', value: 'nurse' },
    { title: 'Patient', value: 'patient' },
    { title: 'Pharmacy', value: 'pharmacy' },
    { title: 'Receptionist', value: 'receptionist' },
]

const allPermissionsFlat = computed(() =>
    Object.values(props.groupedPermissions ?? {}).flat()
)

// Permissions filtered by the selected category
const filteredPermissions = computed(() => {
    if (!categoryFilter.value) return allPermissionsFlat.value
    return allPermissionsFlat.value.filter(p => p.category === categoryFilter.value)
})

const filteredGroupedPermissions = computed(() => {
    return filteredPermissions.value.reduce((acc: Record<string, Permission[]>, p) => {
        const moduleKey = p.module
        if (!acc[moduleKey]) acc[moduleKey] = []
        acc[moduleKey].push(p)
        return acc
    }, {} as Record<string, Permission[]>)
})

const moduleKeys = computed(() =>
    Object.keys(filteredGroupedPermissions.value).sort()
)

function moduleCheckedCount(mod: string) {
    return (
        filteredGroupedPermissions.value[mod] ?? []
    ).filter((p) =>
        form.value.permissions.includes(p.id)
    ).length
}

function isModuleChecked(mod: string) {
    const perms = filteredGroupedPermissions.value[mod] ?? []

    return (
        perms.length > 0 &&
        perms.every((p) =>
            form.value.permissions.includes(p.id)
        )
    )
}

function isModuleIndeterminate(mod: string) {
    const perms = filteredGroupedPermissions.value[mod] ?? []

    const checked = perms.filter((p) =>
        form.value.permissions.includes(p.id)
    )

    return checked.length > 0 &&
        checked.length < perms.length
}

function toggleModule(mod: string, checked: boolean) {
    const perms = filteredGroupedPermissions.value[mod] ?? []

    if (checked) {
        const ids = perms.map((p) => p.id)

        form.value.permissions = [
            ...new Set([
                ...form.value.permissions,
                ...ids,
            ]),
        ]
    } else {
        form.value.permissions =
            form.value.permissions.filter(
                (id) =>
                    !perms.some((p) => p.id === id)
            )
    }
}

function onSubmit() {
    if (props.mode === 'delete') {
        emit('submit', {
            id: props.role?.id,
        })

        return
    }

    emit('submit', {
        id: props.role?.id,
        name: form.value.name,
        label: form.value.label,
        permissions: form.value.permissions,
    })
}
</script>

<template>
    <v-card rounded="lg" max-width="700" width="100%">
        <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
            <div class="d-flex align-center ga-2">
                <v-icon :icon="config.icon" size="20" />
                <span class="text-h6 font-weight-bold">
                    {{ config.title }}
                </span>
            </div>

            <v-btn icon="mdi-close" variant="text" density="compact" @click="emit('cancel')" />
        </v-card-title>

        <v-divider />

        <template v-if="mode === 'delete'">
            <v-card-text class="pa-5">
                <div class="d-flex flex-column align-center text-center ga-3">
                    <v-avatar color="error" variant="tonal" size="56">
                        <v-icon icon="mdi-delete-outline" size="28" />
                    </v-avatar>

                    <div>
                        <p class="text-body-1 font-weight-medium">
                            Are you sure you want to delete
                            this role?
                        </p>

                        <p class="text-body-2 text-medium-emphasis mt-1">
                            <strong>
                                {{ role?.label }}
                            </strong>
                            ({{ role?.name }})
                            will be permanently removed.
                        </p>
                    </div>
                </div>
            </v-card-text>
        </template>

        <template v-else>
            <v-card-text class="pa-4" style="
                    max-height: 550px;
                    overflow-y: auto;
                ">
                <v-row dense>
                    <v-row dense>
                        <v-col cols="12" md="6">
                            <v-label class="text-caption font-weight-medium mb-1">
                                Role Name
                            </v-label>

                            <v-text-field v-model="form.name" placeholder="e.g. admin" variant="outlined"
                                density="compact" hide-details :disabled="mode === 'edit'" />
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-label class="text-caption font-weight-medium mb-1">
                                Display Label
                            </v-label>

                            <v-text-field v-model="form.label" placeholder="e.g. Administrator" variant="outlined"
                                density="compact" hide-details />
                        </v-col>
                    </v-row>

                    <v-col cols="12" class="mt-3">
                        <!-- Permissions -->
                        <div class="mb-2 d-flex align-center justify-space-between flex-wrap ga-2">
                            <div class="text-subtitle-2 font-weight-semibold">
                                <v-icon icon="mdi-key-outline" size="16" class="mr-1" />
                                Permissions
                            </div>

                            <div class="d-flex align-center ga-2">
                                <v-chip size="small" color="primary" variant="tonal">
                                    {{ form.permissions.length }} selected
                                </v-chip>

                                <v-menu v-model="filterMenu" :close-on-content-click="false" location="bottom end">
                                    <template #activator="{ props: menuProps }">
                                        <v-btn v-bind="menuProps" icon variant="tonal"
                                            :color="categoryFilter ? 'primary' : 'secondary'" size="small">
                                            <v-icon icon="mdi-filter-variant" size="18" />
                                        </v-btn>
                                    </template>

                                    <v-card min-width="220" rounded="lg">
                                        <v-card-text class="pa-3">
                                            <div class="text-caption font-weight-medium mb-2">
                                                Filter by category
                                            </div>
                                            <v-select v-model="categoryFilter" :items="categoryOptions"
                                                item-title="title" item-value="value" placeholder="All Categories"
                                                variant="outlined" density="compact" hide-details
                                                @update:model-value="filterMenu = false" />
                                        </v-card-text>
                                    </v-card>
                                </v-menu>
                            </div>
                        </div>

                        <v-card variant="outlined" rounded="lg" class="pa-0 overflow-hidden">
                            <div v-if="moduleKeys.length === 0"
                                class="text-center pa-6 text-medium-emphasis text-caption">
                                No permissions available
                                <template v-if="categoryFilter"> for this category</template>
                            </div>

                            <div v-for="(mod, index) in moduleKeys" :key="mod">
                                <div class="pa-3">
                                    <!-- Module Header -->
                                    <div class="d-flex align-center justify-space-between mb-2">
                                        <v-checkbox :model-value="isModuleChecked(mod)"
                                            :indeterminate="isModuleIndeterminate(mod)" density="compact" hide-details
                                            @update:model-value="
                                                (v) => toggleModule(mod, !!v)
                                            ">
                                            <template #label>
                                                <v-chip size="x-small" color="primary" variant="tonal" class="ml-1">
                                                    {{ mod }}
                                                </v-chip>
                                            </template>
                                        </v-checkbox>

                                        <span class="text-caption text-medium-emphasis">
                                            {{ moduleCheckedCount(mod) }}/{{
                                                filteredGroupedPermissions[mod]?.length ?? 0
                                            }}
                                        </span>
                                    </div>

                                    <!-- Permission Items -->
                                    <div class="d-flex flex-wrap gap-x-4 gap-y-0 pl-8">
                                        <v-checkbox v-for="perm in filteredGroupedPermissions[mod]" :key="perm.id"
                                            :model-value="form.permissions.includes(perm.id)" density="compact"
                                            hide-details class="perm-checkbox" @update:model-value="
                                                (v) => {
                                                    if (v)
                                                        form.permissions.push(
                                                            perm.id
                                                        )
                                                    else
                                                        form.permissions =
                                                            form.permissions.filter(
                                                                (id) =>
                                                                    id !==
                                                                    perm.id
                                                            )
                                                }
                                            ">
                                            <template #label>
                                                <div>
                                                    <div class="text-body-2">
                                                        {{ perm.label }}
                                                    </div>

                                                    <div class="text-caption text-medium-emphasis font-mono">
                                                        {{ perm.name }}
                                                    </div>
                                                </div>
                                            </template>
                                        </v-checkbox>
                                    </div>
                                </div>

                                <v-divider v-if="index < moduleKeys.length - 1" />
                            </div>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card-text>
        </template>

        <v-divider />

        <v-card-actions class="pa-4 pt-3">
            <v-spacer />

            <v-btn variant="tonal" color="secondary" :disabled="loading" @click="emit('cancel')">
                Cancel
            </v-btn>
            <v-btn variant="flat" :color="config.confirmColor" :loading="loading" :disabled="loading"
                :style="loading ? 'cursor: not-allowed; pointer-events: auto;' : ''" @click="onSubmit">
                {{ config.confirmLabel }}
            </v-btn>
        </v-card-actions>
    </v-card>
</template>

<style scoped>
.font-mono {
    font-family: 'Courier New', monospace;
    font-size: 12px;
}

.perm-checkbox {
    min-width: 180px;
}
</style>