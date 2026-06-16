<script setup lang="ts">
import { ref, computed } from 'vue';
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue';
import NurseModal from './NurseModal.vue';

definePageMeta({
    middleware: ['auth'],
})

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

const search = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;

const { data, pending, refresh } = await useFetch<{ nurses: any[] }>('/api/nurses')
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
const availableUsers = computed(() => availableData.value?.users ?? [])

const filteredNurses = computed(() => {
    return nurses.value.filter((n) =>
        n.full_name.toLowerCase().includes(search.value.toLowerCase()) ||
        n.email.toLowerCase().includes(search.value.toLowerCase())
    )
})

const paginatedNurses = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    return filteredNurses.value.slice(start, start + itemsPerPage);
});

const totalPages = computed(() => Math.ceil(filteredNurses.value.length / itemsPerPage));

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
    modalMode.value = 'edit'
    selectedNurse.value = nurse
    dialog.value = true
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
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex flex-wrap align-center justify-space-between ga-3">
            <div>
                <div class="text-caption text-uppercase text-medium-emphasis">Nurse Directory</div>
                <v-card-title class="text-h4">Nurses Management</v-card-title>
                <v-card-subtitle class="mt-1">Manage nurse profiles and departments.</v-card-subtitle>
            </div>
            <v-btn
                color="primary"
                variant="flat"
                size="large"
                prepend-icon="mdi-plus"
                density="comfortable"
                @click="openAdd"
            >
                Create Nurse
            </v-btn>
        </div>
    </v-card-item>

    <UiTitleCard class-name="px-0 pb-0 rounded-md">
        <div class="d-flex align-center justify-space-between gap-3 px-4 py-3 flex-wrap">
            <v-text-field v-model="search" placeholder="Search by name or email..." prepend-inner-icon="mdi-magnify"
                variant="outlined" density="compact" hide-details clearable style="max-width: 320px"
                @update:model-value="onSearch" />
        </div>

        <v-divider />

        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Nurse</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Department</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Phone</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Experience</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Status</th>
                    <th class="text-right text-caption font-weight-bold text-uppercase">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending">
                    <td colspan="6" class="text-center py-8">
                        <v-progress-circular indeterminate color="primary" />
                    </td>
                </tr>
                <tr v-else-if="paginatedNurses.length === 0">
                    <td colspan="6" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-doctor" size="32" class="mb-2 d-block mx-auto" />
                        No nurses found
                    </td>
                </tr>
                <tr v-else v-for="nurse in paginatedNurses" :key="nurse.id">
                    <td class="py-3">
                        <div class="d-flex align-center ga-3">
                            <v-avatar size="34" color="primary" variant="tonal" :image="nurse.photo_url || undefined">
                                <span v-if="!nurse.photo_url" class="text-caption font-weight-bold">
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
                        <v-btn icon="mdi-pencil-outline" variant="text" size="small" color="secondary"
                            density="comfortable" @click="openEdit(nurse)" />
                        <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error" density="comfortable"
                            @click="openDelete(nurse)" />
                    </td>
                </tr>
            </tbody>
        </v-table>

        <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
                Showing {{ paginatedNurses.length }} of {{ filteredNurses.length }} nurses
            </span>
            <v-pagination v-if="totalPages > 1" v-model="currentPage" :length="totalPages" density="compact"
                size="small" />
        </div>
    </UiTitleCard>

    <v-dialog v-model="dialog" max-width="600" persistent>
        <NurseModal :mode="modalMode" :nurse="selectedNurse" :available-users="availableUsers"
            :departments="departments" @submit="handleSubmit" @cancel="closeModal" />
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" timeout="3000">
        {{ snackbarMsg }}
        <template #actions>
            <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
        </template>
    </v-snackbar>
</template>
