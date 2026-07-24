<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue';
import NurseModal from './NurseModal.vue';

interface Nurse {
    id: string
    full_name: string
    email: string
    phone: string
    photo_url: string
    experience_years: number
    is_available: boolean
    department: { id: string; name: string; code?: string } | null
    created?: string
}

const { can } = usePermission()
const route = useRoute()
const slug = computed(() => route.params.slug as string)

const search = ref('');
const filterDepartment = ref('');
const filterAvailable = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;

const queryParams = computed(() => ({
    page: currentPage.value,
    limit: itemsPerPage,
    search: search.value || undefined,
    department: filterDepartment.value || undefined,
    available: filterAvailable.value || undefined,
}))

const { data, pending, refresh } = await useFetch<{
    nurses: any[]
    total: number
    totalPages: number
}>('/api/nurses', { query: queryParams })

const { data: deptData } = await useFetch<{ departments: any[] }>('/api/departments')
const { data: availableData, refresh: refreshAvailable } = await useFetch<{ users: any[] }>('/api/nurses/available')

const nurses = computed<Nurse[]>(() =>
    (data.value?.nurses ?? []).map((n) => ({
        id: n.id,
        full_name: n.full_name ?? '-',
        email: n.email ?? '-',
        phone: n.phone ?? '-',
        photo_url: n.photo_url ?? '',
        experience_years: n.experience_years ?? 0,
        is_available: n.is_available ?? true,
        department: n.department ?? null,
        created: n.created_at,
    }))
)

const departments = computed(() => deptData.value?.departments ?? [])

const availableUsers = ref<any[]>([])
watch(
    availableData,
    (val) => {
        availableUsers.value = val?.users ?? []
    },
    { immediate: true }
)

async function handleCreateUser(payload: {
    full_name: string
    email: string
}) {
    try {
        const res: any = await $fetch('/api/users', {
            method: 'POST',
            body: {
                full_name: payload.full_name,
                email: payload.email,
                password: 'Password123',
                role: 'nurse'
            }
        })

        const newUser = {
            id: res.user.id,
            full_name: payload.full_name,
            email: payload.email
        }

        availableUsers.value.unshift(newUser)

        notify('Nurse account created successfully')

        return newUser
    } catch (error: any) {
        notify(
            error?.data?.message ??
            'Failed to create nurse account',
            'error'
        )
        return null
    }
}

const totalPages = computed(() => data.value?.totalPages ?? 1)
const totalNurses = computed(() => data.value?.total ?? 0)

function onFilterChange() {
    currentPage.value = 1
}

watch([search, filterDepartment, filterAvailable, currentPage], () => { refresh() })

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function onSearch() {
    currentPage.value = 1;
}

const dialog = ref(false)
const modalMode = ref<'add' | 'edit' | 'delete'>('add')
const selectedNurse = ref<Nurse | null>(null)
const loading = ref(false)

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
    selectedNurse.value = null
    dialog.value = true
}

function openEdit(nurse: Nurse) {
    if (route.params.slug) {
        navigateTo(`/${route.params.slug}/nurses/${nurse.id}/edit`)
    } else {
        navigateTo({ query: { section: 'nurse-edit', entityId: nurse.id } })
    }
}

function openDelete(nurse: Nurse) {
    modalMode.value = 'delete'
    selectedNurse.value = nurse
    dialog.value = true
}

function closeModal() {
    dialog.value = false
    selectedNurse.value = null
}

const actionLoading = computed(() => loading.value || pending.value)

async function handleSubmit(payload: any) {
    loading.value = true
    try {
        if (modalMode.value === 'add') {
            await $fetch('/api/nurses', {
                method: 'POST',
                body: {
                    id: payload.id,
                    department_id: payload.department_id,
                    phone: payload.phone,
                    photo_url: payload.photo_url,
                    experience_years: payload.experience_years,
                    is_available: payload.is_available,
                }
            })
            notify('Nurse created successfully')
        } else if (modalMode.value === 'edit') {
            await $fetch('/api/nurses', {
                method: 'PUT',
                body: {
                    id: payload.id,
                    department_id: payload.department_id,
                    phone: payload.phone,
                    photo_url: payload.photo_url,
                    experience_years: payload.experience_years,
                    is_available: payload.is_available,
                }
            })
            notify('Nurse updated successfully')
        } else if (modalMode.value === 'delete') {
            await $fetch('/api/nurses', {
                method: 'DELETE',
                body: { id: payload.id }
            })
            notify('Nurse removed successfully')
        }

        await refresh()
        await refreshAvailable()
        closeModal()
    } catch (e: any) {
        notify(e?.data?.message ?? 'Something went wrong', 'error')
    } finally {
        loading.value = false
    }
}
function openView(nurses: Nurse) {
    if (route.params.slug) {
        navigateTo(`/${route.params.slug}/nurses/${nurses.id}`)
    } else {
        navigateTo({ query: { section: 'nurse-detail', entityId: nurses.id } })
    }
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex flex-wrap align-center justify-space-between ga-3">
            <div>
                <div class="text-caption text-uppercase text-medium-emphasis">Nurse Directory</div>
                <v-card-title class="text-h4">Nurses Management</v-card-title>
                <v-card-subtitle class="mt-1">Manage nurse profiles and departments.</v-card-subtitle>
            </div>
            <v-btn v-if="can('nurse.create')" color="primary" variant="flat" size="large" prepend-icon="mdi-plus"
                density="comfortable" @click="openAdd">
                Create Nurse
            </v-btn>
        </div>
    </v-card-item>

    <UiTitleCard class-name="px-0 pb-0 rounded-md">
        <div class="d-flex justify-space-between align-center gap-3 px-4 py-3 flex-wrap">
            <v-text-field v-model="search" placeholder="Search by name or email..." prepend-inner-icon="mdi-magnify"
                variant="outlined" density="compact" hide-details clearable style="max-width: 280px"
                @update:model-value="onSearch" />

            <div class="d-flex justify-space-between align-center gap-3 px-4 py-3 flex-wrap">
                <v-select v-model="filterDepartment" :items="[{ id: '', name: 'All Departments' }, ...departments]"
                    item-title="name" item-value="id" variant="outlined" density="compact" hide-details
                    style="max-width: 200px" @update:model-value="onFilterChange" />

                <v-select v-model="filterAvailable" :items="[
                    { title: 'All Status', value: '' },
                    { title: 'Available', value: 'true' },
                    { title: 'Unavailable', value: 'false' },
                ]" item-title="title" item-value="value" variant="outlined" density="compact" hide-details
                    style="max-width: 160px" @update:model-value="onFilterChange" />
            </div>
        </div>

        <v-divider />

        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Nurse</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Department</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Phone</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Experience</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Status</th>
                    <th class="text-no-wrap text-right text-caption font-weight-bold text-uppercase">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending" v-for="i in 5" :key="i">
                    <td colspan="6" style="border-bottom: none;">
                        <v-skeleton-loader type="table-row" class="my-1" />
                    </td>
                </tr>
                <tr v-else-if="nurses.length === 0">
                    <td colspan="6" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-doctor" size="32" class="mb-2 d-block mx-auto" />
                        No nurses found
                    </td>
                </tr>
                <tr v-else v-for="nurse in nurses" :key="nurse.id">
                    <td class="py-3">
                        <div class="d-flex align-center ga-3">
                            <v-avatar size="34" color="primary" variant="tonal">
                                <v-img v-if="nurse.photo_url" :src="nurse.photo_url" cover />
                                <span v-else class="text-caption font-weight-bold">
                                    {{ getInitials(nurse.full_name) }}
                                </span>
                            </v-avatar>
                            <div>
                                <div class="text-body-2 font-weight-medium">{{ nurse.full_name }}</div>
                                <div class="text-caption text-medium-emphasis">{{ nurse.email }}</div>
                            </div>
                        </div>
                    </td>
                    <td class="py-3">
                        <v-chip v-if="nurse.department" size="small" variant="tonal" color="secondary" label>
                            {{ nurse.department.name }}
                        </v-chip>
                        <span v-else class="text-medium-emphasis">-</span>
                    </td>
                    <td class="py-3 text-body-2 text-medium-emphasis">
                        {{ nurse.phone }}
                    </td>
                    <td class="py-3 text-body-2 text-medium-emphasis">
                        {{ nurse.experience_years }} years
                    </td>
                    <td class="py-3">
                        <v-chip :color="nurse.is_available ? 'success' : 'default'" variant="tonal" size="small">
                            {{ nurse.is_available ? 'Available' : 'Unavailable' }}
                        </v-chip>
                    </td>
                    <td class="py-3 text-right">
                        <v-btn @click="openView(nurse)" icon="mdi-eye-outline" variant="text" size="small"
                            color="primary" density="comfortable" />
                        <v-btn v-if="can('nurse.edit')" icon="mdi-pencil-outline" variant="text" size="small"
                            color="secondary" density="comfortable" @click="openEdit(nurse)" />
                        <v-btn v-if="can('nurse.delete')" icon="mdi-delete-outline" variant="text" size="small"
                            color="error" density="comfortable" @click="openDelete(nurse)" />
                    </td>
                </tr>
            </tbody>
        </v-table>

        <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
                Showing {{ nurses.length }} of {{ totalNurses }} nurses
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

    <v-dialog v-model="dialog" max-width="600">
        <NurseModal :loading="actionLoading" :mode="modalMode" :nurse="selectedNurse" :available-users="availableUsers"
            :departments="departments" :on-create-user="handleCreateUser" @submit="handleSubmit" @cancel="closeModal" />
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" timeout="3000">
        {{ snackbarMsg }}
        <template #actions>
            <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
        </template>
    </v-snackbar>
</template>
