<script setup lang="ts">
import { ref, computed } from 'vue';
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue';
import DepartmentModal from './DepartmentModal.vue';

definePageMeta({
    middleware: ['auth'],
})

interface Department {
    id: string
    name: string
    code: string
    description: string
    created?: string
}
const { can } = usePermission()
const route = useRoute()
const slug = computed(() => route.params.slug as string)

const search = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;

const { data, pending } = await useFetch<{ departments: any[] }>('/api/departments')

const departments = computed(() =>
    (data.value?.departments ?? []).map((d) => ({
        id: d.id,
        name: d.name ?? '-',
        code: d.code ?? '-',
        description: d.description ?? '-',
        created: d.created_at,
    }))
)

const filteredDepartments = computed(() => {
    return departments.value.filter((d) =>
        d.name.toLowerCase().includes(search.value.toLowerCase()) ||
        d.code.toLowerCase().includes(search.value.toLowerCase())
    )
})

const paginatedDepartments = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    return filteredDepartments.value.slice(start, start + itemsPerPage);
});

const totalPages = computed(() => Math.ceil(filteredDepartments.value.length / itemsPerPage));

function formatDate(dateStr?: string) {
    if (!dateStr) return '-'
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
const modalMode = ref<'add' | 'delete'>('add')
const selectedDepartment = ref<Department | null>(null)
const loading = ref(false)
const actionLoading = computed(() => loading.value || pending.value)

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
    selectedDepartment.value = null
    dialog.value = true
}

function onModalCancel() {
    if (!loading.value) closeModal()
}

function openDelete(department: Department) {
    modalMode.value = 'delete'
    selectedDepartment.value = department
    dialog.value = true
}

function closeModal() {
    dialog.value = false
    selectedDepartment.value = null
}

async function handleSubmit(payload: any) {
    loading.value = true
    try {
        if (modalMode.value === 'add') {
            await $fetch('/api/departments', {
                method: 'POST',
                body: {
                    name: payload.name,
                    code: payload.code,
                    description: payload.description
                }
            })
            notify('Department created successfully')
        } else if (modalMode.value === 'delete') {
            await $fetch('/api/departments', {
                method: 'DELETE',
                body: { id: payload.id }
            })
            notify('Department deleted successfully')
        }

        await refreshNuxtData()
        closeModal()
    } catch (e: any) {
        notify(e?.data?.message ?? 'Something went wrong', 'error')
    } finally {
        loading.value = false
    }
}
function openView(department: Department) {
    navigateTo(`/${slug.value}/departments/${department.id}`)
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex justify-space-between align-center">
            <div>
                <v-card-title class="text-h3">Departments Management</v-card-title>
                <v-card-subtitle class="mt-1">Manage and organize departments / poli</v-card-subtitle>
            </div>
            <v-btn v-if="can('department.create')" color="primary" variant="flat" size="large" prepend-icon="mdi-plus"
                density="comfortable" @click="openAdd">
                Add Department
            </v-btn>
        </div>
    </v-card-item>

    <UiTitleCard class-name="px-0 pb-0 rounded-md">
        <div class="d-flex align-center justify-space-between gap-3 px-4 py-3 flex-wrap">
            <v-text-field v-model="search" placeholder="Search by name or code..." prepend-inner-icon="mdi-magnify"
                variant="outlined" density="compact" hide-details clearable style="max-width: 280px"
                @update:model-value="onSearch" />
        </div>

        <v-divider />

        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Name</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Code</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Description</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Created</th>
                    <th class="text-right text-caption font-weight-bold text-uppercase">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending">
                    <td colspan="5" class="text-center py-8">
                        <v-progress-circular indeterminate color="primary" />
                    </td>
                </tr>
                <tr v-else-if="paginatedDepartments.length === 0">
                    <td colspan="5" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-folder-search-outline" size="32" class="mb-2 d-block mx-auto" />
                        No department found
                    </td>
                </tr>
                <tr v-else v-for="department in paginatedDepartments" :key="department.id">
                    <td class="py-3">
                        <div class="d-flex align-center ga-2">
                            <span class="text-body-2 font-weight-medium">{{ department.name }}</span>
                        </div>
                    </td>
                    <td class="py-3">
                        <v-chip v-if="department.code !== '-'" size="small" variant="tonal" color="secondary" label>
                            {{ department.code }}
                        </v-chip>
                        <span v-else class="text-medium-emphasis">-</span>
                    </td>
                    <td class="py-3">
                        <v-tooltip v-if="department.description && department.description.length > 50" location="top">
                            <template #activator="{ props }">
                                <span v-bind="props" class="text-body-2 text-medium-emphasis cursor-pointer">
                                    {{ department.description.slice(0, 50) }}...
                                </span>
                            </template>

                            {{ department.description }}
                        </v-tooltip>

                        <span v-else class="text-body-2 text-medium-emphasis">
                            {{ department.description }}
                        </span>
                    </td>
                    <td class="py-3 text-body-2 text-medium-emphasis">
                        {{ formatDate(department.created) }}
                    </td>
                    <td class="py-3 text-right">
                        <v-btn @click="openView(department)" icon="mdi-eye-outline" variant="text" size="small"
                            color="primary" density="comfortable" />
                        <v-btn v-if="can('department.delete')" icon="mdi-delete-outline" variant="text" size="small"
                            color="error" density="comfortable" @click="openDelete(department)" />
                    </td>
                </tr>
            </tbody>
        </v-table>

        <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
                Showing {{ paginatedDepartments.length }} of {{ filteredDepartments.length }} departments
            </span>
            <v-pagination v-if="totalPages > 1" v-model="currentPage" :length="totalPages" :total-visible="6"
                density="compact" size="small" />
        </div>
    </UiTitleCard>

    <v-dialog v-model="dialog" max-width="500" persistent>
        <DepartmentModal :mode="modalMode" :department="selectedDepartment" :loading="actionLoading"
            @submit="handleSubmit" @cancel="closeModal" />
    </v-dialog>


    <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" timeout="3000">
        {{ snackbarMsg }}
        <template #actions>
            <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
        </template>
    </v-snackbar>
</template>