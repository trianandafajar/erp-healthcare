<script setup lang="ts">
import { ref, computed } from 'vue';
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue';
import UserModal from './UserModal.vue';

const search = ref('');
const selectedRole = ref('all');
const currentPage = ref(1);
const itemsPerPage = 10;

const roles = [
    { value: 'all', label: 'All' },
    { value: 'admin', label: 'Admin' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'specialist', label: 'Specialist' },
    { value: 'pharmacy', label: 'Pharmacy' },
    { value: 'staff', label: 'Staff' },
    { value: 'patient', label: 'Patient' }
];

const roleColors: Record<string, string> = {
    admin: 'roleAdmin',
    doctor: 'roleDoctor',
    specialist: 'roleSpecialist',
    pharmacy: 'rolePharmacy',
    staff: 'roleStaff',
    patient: 'rolePatient'
};

const { data, pending } = await useFetch<{ profiles: any[] }>('/api/users')

const users = computed(() =>
    (data.value?.profiles ?? []).map((u) => ({
        id: u.id,
        name: u.full_name ?? '-',
        email: u.email ?? '-',
        role: u.role,
        status: u.status,
        joined: u.created_at,
    }))
)

const filteredUsers = computed(() => {
    return users.value.filter((u) => {
        const matchRole = selectedRole.value === 'all' || u.role === selectedRole.value;
        const matchSearch =
            u.name.toLowerCase().includes(search.value.toLowerCase()) ||
            u.email.toLowerCase().includes(search.value.toLowerCase());
        return matchRole && matchSearch;
    });
});

const paginatedUsers = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    return filteredUsers.value.slice(start, start + itemsPerPage);
});

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / itemsPerPage));

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

function onRoleChange() {
    currentPage.value = 1;
}

function onSearch() {
    currentPage.value = 1;
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

async function handleSubmit(payload: any) {
    if (modalMode.value === 'add') {
        await $fetch('/api/users', {
            method: 'POST',
            body: {
                email: payload.email,
                password: 'Password123',
                full_name: payload.full_name,
                role: payload.role,
                status: payload.status
            }
        })
    }
    else if (modalMode.value === 'edit') {
        await $fetch('/api/users', {
            method: 'PUT',
            body: {
                id: payload.id,
                full_name: payload.full_name,
                role: payload.role,
                status: payload.status
            }
        })
    }
    // } else if (modalMode.value === 'delete') {
    //     await $fetch(`/api/users/${payload.id}`, { method: 'DELETE' })
    // }
    await refreshNuxtData()
    closeModal()
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex justify-space-between align-center">
            <v-card-title class="text-h3">Management Users</v-card-title>
            <v-btn color="primary" variant="flat" size="large" prepend-icon="mdi-plus" density="comfortable"
                @click="openAdd">
                Add User
            </v-btn>
        </div>
    </v-card-item>

    <UiTitleCard class-name="px-0 pb-0 rounded-md">
        <div class="d-flex align-center justify-space-between gap-3 px-4 py-3 flex-wrap">
            <v-text-field v-model="search" placeholder="Search by name or email..." prepend-inner-icon="mdi-magnify"
                variant="outlined" density="compact" hide-details clearable style="max-width: 280px"
                @update:model-value="onSearch" />
            <v-btn-toggle v-model="selectedRole" density="compact" variant="tonal" divided mandatory color="primary"
                class="flex-wrap" @update:model-value="onRoleChange">
                <v-btn v-for="role in roles" :key="role.value" :value="role.value" size="small">
                    {{ role.label }}
                </v-btn>
            </v-btn-toggle>
        </div>

        <v-divider />

        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-left text-caption font-weight-bold text-uppercase">User</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Role</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Status</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Joined</th>
                    <th class="text-right text-caption font-weight-bold text-uppercase">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending">
                    <td colspan="5" class="text-center py-8">
                        <v-progress-circular indeterminate color="primary" />
                    </td>
                </tr>
                <tr v-else-if="paginatedUsers.length === 0">
                    <td colspan="5" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-account-search" size="32" class="mb-2 d-block mx-auto" />
                        No users found
                    </td>
                </tr>
                <tr v-else v-for="user in paginatedUsers" :key="user.id">
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
                        <v-chip :color="roleColors[user.role]" variant="tonal" size="small" class="text-capitalize">
                            {{ user.role }}
                        </v-chip>
                    </td>
                    <td class="py-3">
                        <v-chip :color="user.status === 'active' ? 'success' : 'default'" variant="tonal" size="small">
                            {{ user.status === 'active' ? 'Active' : 'Inactive' }}
                        </v-chip>
                    </td>
                    <td class="py-3 text-body-2 text-medium-emphasis">
                        {{ formatDate(user.joined) }}
                    </td>
                    <td class="py-3 text-right">
                        <v-btn icon="mdi-pencil-outline" variant="text" size="small" color="secondary"
                            density="comfortable" @click="openEdit(user)" />
                        <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error"
                            density="comfortable" />
                    </td>
                </tr>
            </tbody>
        </v-table>

        <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
                Showing {{ paginatedUsers.length }} of {{ filteredUsers.length }} users
            </span>
            <v-pagination v-if="totalPages > 1" v-model="currentPage" :length="totalPages" density="compact"
                size="small" />
        </div>
    </UiTitleCard>
    <div class="text-xs-center">
        <v-dialog v-model="dialog" width="480" persistent>
            <UserModal :mode="modalMode" :user="selectedUser" @submit="handleSubmit" @cancel="closeModal" />
        </v-dialog>
    </div>
</template>