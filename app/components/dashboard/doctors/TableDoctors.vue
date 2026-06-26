<script setup lang="ts">
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue';
import DoctorModal from './DoctorModal.vue';

definePageMeta({
    middleware: ['auth'],
})

interface Doctor {
    id: string
    full_name: string
    email: string
    specialization: string
    str_number: string
    sip_number: string
    phone: string
    photo_url: string
    biography: string
    experience_years: number
    consultation_fee: number
    is_available: boolean
    department: { id: string; name: string; code?: string } | null
    created?: string
}

const search = ref('');
const filterDepartment = ref('');
const filterAvailable = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;

const { can } = usePermission()

const { data, pending, refresh } = await useFetch<{ doctors: any[] }>('/api/doctors')
const { data: deptData, refresh: refreshDepts } = await useFetch<{ departments: any[] }>('/api/departments')
const { data: availableData, refresh: refreshAvailable } = await useFetch<{ users: any[] }>('/api/doctors/available')

const doctors = computed<Doctor[]>(() =>
    (data.value?.doctors ?? []).map((d) => ({
        id: d.id,
        full_name: d.full_name ?? '-',
        email: d.email ?? '-',
        specialization: d.specialization ?? '-',
        str_number: d.str_number ?? '-',
        sip_number: d.sip_number ?? '-',
        phone: d.phone ?? '-',
        photo_url: d.photo_url ?? '',
        biography: d.biography ?? '',
        experience_years: d.experience_years ?? 0,
        consultation_fee: d.consultation_fee ?? 0,
        is_available: d.is_available ?? true,
        department: d.department ?? null,
        created: d.created_at,
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

const paginatedDoctors = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    return filteredDoctors.value.slice(start, start + itemsPerPage);
});

const totalPages = computed(() => Math.ceil(filteredDoctors.value.length / itemsPerPage));

function formatDate(dateStr?: string) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function formatCurrency(value: number) {
    if (!value) return '-'
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(value)
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

const filteredDoctors = computed(() => {
    return doctors.value.filter((d) => {
        const matchSearch =
            d.full_name.toLowerCase().includes(search.value.toLowerCase()) ||
            d.email.toLowerCase().includes(search.value.toLowerCase()) ||
            d.specialization.toLowerCase().includes(search.value.toLowerCase())

        const matchDept =
            !filterDepartment.value || d.department?.id === filterDepartment.value

        const matchAvail =
            filterAvailable.value === '' ||
            (filterAvailable.value === 'true' ? d.is_available : !d.is_available)

        return matchSearch && matchDept && matchAvail
    })
})

function onSearch() {
    currentPage.value = 1;
}

function onFilterChange() {
    currentPage.value = 1;
}

const dialog = ref(false)
const modalMode = ref<'add' | 'delete'>('add')
const selectedDoctor = ref<Doctor | null>(null)
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
    selectedDoctor.value = null
    dialog.value = true
}

function openDelete(doctor: Doctor) {
    modalMode.value = 'delete'
    selectedDoctor.value = doctor
    dialog.value = true
}

function closeModal() {
    dialog.value = false
    selectedDoctor.value = null
}

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
                role: 'doctor'
            }
        })

        const newUser = {
            id: res.user.id,
            full_name: payload.full_name,
            email: payload.email
        }

        availableUsers.value.unshift(newUser)

        notify('Doctor account created successfully')

        return newUser
    } catch (error: any) {
        notify(
            error?.data?.message ??
            'Failed to create doctor account',
            'error'
        )
        return null
    }
}

async function handleCreateDepartment(payload: { name: string; code: string; description?: string }) {
    try {
        const res: any = await $fetch('/api/departments', {
            method: 'POST',
            body: {
                name: payload.name,
                code: payload.code || null,
                description: payload.description || ''
            }
        })

        await refreshDepts()
        notify('Department created successfully')

        return res.department ?? res
    } catch (error: any) {
        notify(
            error?.data?.message ?? 'Failed to create department',
            'error'
        )
        return null
    }
}

const actionLoading = computed(() => loading.value || pending.value)

async function handleSubmit(payload: any) {
    loading.value = true
    try {
        if (modalMode.value === 'add') {
            await $fetch('/api/doctors', {
                method: 'POST',
                body: {
                    id: payload.id,
                    department_id: payload.department_id,
                    specialization: payload.specialization,
                    str_number: payload.str_number,
                    sip_number: payload.sip_number,
                    phone: payload.phone,
                    photo_url: payload.photo_url,
                    biography: payload.biography,
                    experience_years: payload.experience_years,
                    consultation_fee: payload.consultation_fee,
                    is_available: payload.is_available,
                }
            })
            notify('Doctor created successfully')
        } else if (modalMode.value === 'delete') {
            await $fetch('/api/doctors', {
                method: 'DELETE',
                body: { id: payload.id }
            })
            notify('Doctor removed successfully')
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
function openView(doctor: Doctor) {
    navigateTo(`/doctors/${doctor.id}`)
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex justify-space-between align-center">
            <div>
                <v-card-title class="text-h3">Doctors Management</v-card-title>
                <v-card-subtitle class="mt-1">Manage doctor profiles, specializations, and departments</v-card-subtitle>
            </div>
            <v-btn v-if="can('doctor.create')" color="primary" variant="flat" size="large" prepend-icon="mdi-plus"
                density="comfortable" @click="openAdd">
                Add Doctor
            </v-btn>
        </div>
    </v-card-item>

    <UiTitleCard class-name="px-0 pb-0 rounded-md">
        <div class="d-flex align-center justify-space-between gap-3 px-4 py-3 flex-wrap">
            <v-text-field v-model="search" placeholder="Search by name, email, or specialization..."
                prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable
                style="max-width: 320px" @update:model-value="onSearch" />

            <div class="d-flex align-center justify-space-between gap-3 px-4 py-3 flex-wrap">
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
                    <th class="text-left text-caption font-weight-bold text-uppercase">Doctor</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Specialization</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Department</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Experience</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Fee</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Status</th>
                    <th class="text-right text-caption font-weight-bold text-uppercase">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending">
                    <td colspan="7" class="text-center py-8">
                        <v-progress-circular indeterminate color="primary" />
                    </td>
                </tr>
                <tr v-else-if="paginatedDoctors.length === 0">
                    <td colspan="7" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-stethoscope" size="32" class="mb-2 d-block mx-auto" />
                        No doctors found
                    </td>
                </tr>
                <tr v-else v-for="doctor in paginatedDoctors" :key="doctor.id">
                    <td class="py-3">
                        <div class="d-flex align-center ga-3">
                            <v-avatar size="34" color="primary" variant="tonal">
                                <v-img v-if="doctor.photo_url" :src="doctor.photo_url" cover />
                                <span v-else class="text-caption font-weight-bold">
                                    {{ getInitials(doctor.full_name) }}
                                </span>
                            </v-avatar>
                            <div>
                                <div class="text-body-2 font-weight-medium">{{ doctor.full_name }}</div>
                                <div class="text-caption text-medium-emphasis">{{ doctor.email }}</div>
                            </div>
                        </div>
                    </td>
                    <td class="py-3 text-body-2 text-medium-emphasis">
                        {{ doctor.specialization }}
                    </td>
                    <td class="py-3">
                        <v-chip v-if="doctor.department" size="small" variant="tonal" color="secondary" label>
                            {{ doctor.department.name }}
                        </v-chip>
                        <span v-else class="text-medium-emphasis">-</span>
                    </td>
                    <td class="py-3 text-body-2 text-medium-emphasis">
                        {{ doctor.experience_years }} years
                    </td>
                    <td class="py-3 text-body-2 text-medium-emphasis">
                        {{ formatCurrency(doctor.consultation_fee) }}
                    </td>
                    <td class="py-3">
                        <v-chip :color="doctor.is_available ? 'success' : 'default'" variant="tonal" size="small">
                            {{ doctor.is_available ? 'Available' : 'Unavailable' }}
                        </v-chip>
                    </td>
                    <td class="py-3 text-right">
                        <v-btn @click="openView(doctor)" icon="mdi-eye-outline" variant="text" size="small"
                            color="primary" density="comfortable" />
                        <v-btn v-if="can('doctor.delete')" icon="mdi-delete-outline" variant="text" size="small"
                            color="error" density="comfortable" @click="openDelete(doctor)" />
                    </td>
                </tr>
            </tbody>
        </v-table>

        <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
                Showing {{ paginatedDoctors.length }} of {{ filteredDoctors.length }} doctors
            </span>
            <v-pagination v-if="totalPages > 1" v-model="currentPage" :length="totalPages" density="compact"
                size="small" />
        </div>
    </UiTitleCard>

    <v-dialog v-model="dialog" max-width="600" persistent>
        <DoctorModal :mode="modalMode" :doctor="selectedDoctor" :available-users="availableUsers"
            :departments="departments" :on-create-user="handleCreateUser" :on-create-department="handleCreateDepartment"
            :loading="actionLoading" @submit="handleSubmit" @cancel="closeModal" />
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" timeout="3000">
        {{ snackbarMsg }}
        <template #actions>
            <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
        </template>
    </v-snackbar>
</template>
