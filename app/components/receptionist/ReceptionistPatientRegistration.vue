<script setup lang="ts">
import PatientModal from '../dashboard/patient/PatientModal.vue';

definePageMeta({
    middleware: ['auth'],
})

interface Patient {
    id: string
    medical_record_number: string
    profile_id: string | null
    full_name: string
    date_of_birth: string
    gender: string | null
    phone: string
    address: string
    blood_type: string | null
    email: string | null
    has_account: boolean
    description?: string | null
    length_of_stay?: string | null
}

const { can } = usePermission()

const search = ref('')
const genderFilter = ref('all')
const currentPage = ref(1)
const itemsPerPage = 10

const queryParams = computed(() => ({
    page: currentPage.value,
    limit: itemsPerPage,
    search: search.value || undefined,
    gender: genderFilter.value !== 'all' ? genderFilter.value : undefined,
}))

const { data, pending, refresh } = await useFetch<{
    patients: any[]
    total: number
    totalPages: number
}>('/api/patients', { query: queryParams })

const patients = computed<Patient[]>(() =>
    (data.value?.patients ?? []).map((p) => ({
        id: p.id,
        medical_record_number: p.medical_record_number ?? '-',
        profile_id: p.profile_id ?? null,
        full_name: p.full_name ?? '-',
        date_of_birth: p.date_of_birth ?? '',
        gender: p.gender ?? null,
        phone: p.phone ?? '-',
        address: p.address ?? '-',
        blood_type: p.blood_type ?? null,
        email: p.email ?? null,
        has_account: !!p.profile_id,
        description: p.description ?? null,
        length_of_stay: p.length_of_stay ?? null,
    }))
)

const genderOptions = [
    { label: 'All', value: 'all' },
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
]

const totalPages = computed(() => data.value?.totalPages ?? 1)
const totalPatients = computed(() => data.value?.total ?? 0)

watch([search, genderFilter, currentPage], () => { refresh() })

function getInitials(name: string) {
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

function calculateAge(dateStr?: string) {
    if (!dateStr) return null
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
}

const bloodTypeColors: Record<string, string> = {
    A: 'error', B: 'primary', AB: 'purple', O: 'success',
}

const dialog = ref(false)
const modalMode = ref<'add' | 'edit' | 'delete'>('add')
const selectedPatient = ref<Patient | null>(null)
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
    selectedPatient.value = null
    dialog.value = true
}

function openEdit(patient: Patient) {
    modalMode.value = 'edit'
    selectedPatient.value = patient
    dialog.value = true
}

function openDelete(patient: Patient) {
    modalMode.value = 'delete'
    selectedPatient.value = patient
    dialog.value = true
}

function closeModal() {
    dialog.value = false
    selectedPatient.value = null
}

const actionLoading = computed(() => loading.value)

async function handleSubmit(payload: any) {
    loading.value = true
    try {
        if (modalMode.value === 'add') {
            await $fetch('/api/patients', {
                method: 'POST',
                body: {
                    full_name: payload.full_name,
                    date_of_birth: payload.date_of_birth,
                    gender: payload.gender,
                    phone: payload.phone,
                    address: payload.address,
                    blood_type: payload.blood_type,
                    email: payload.email,
                    description: payload.description,
                    length_of_stay: payload.length_of_stay,
                }
            })
            notify('Patient registered successfully')
        } else if (modalMode.value === 'edit') {
            await $fetch('/api/patients', {
                method: 'PUT',
                body: {
                    id: payload.id,
                    full_name: payload.full_name,
                    date_of_birth: payload.date_of_birth,
                    gender: payload.gender,
                    phone: payload.phone,
                    address: payload.address,
                    blood_type: payload.blood_type,
                    room: payload.room,
                    email: payload.email,
                    description: payload.description,
                    length_of_stay: payload.length_of_stay,
                }
            })
            notify('Patient updated successfully')
        } else if (modalMode.value === 'delete') {
            await $fetch('/api/patients', {
                method: 'DELETE',
                body: { id: payload.id }
            })
            notify('Patient deleted successfully')
        }

        await refresh()
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
        <div class="d-flex justify-space-between align-center">
            <div>
                <v-card-title class="text-h3">Patient Registration</v-card-title>
                <v-card-subtitle class="mt-1">Register new patients and manage existing records</v-card-subtitle>
            </div>
            <v-btn v-if="can('patient.create')" color="primary" variant="flat" size="large"
                prepend-icon="mdi-account-plus-outline" density="comfortable" @click="openAdd">
                Register Patient
            </v-btn>
        </div>
    </v-card-item>

    <UiTitleCard class-name="px-0 pb-0 rounded-md" >
        <div class="d-flex align-center justify-space-between gap-3 px-4 py-3 flex-wrap">
            <v-text-field v-model="search" placeholder="Search by name, MRN, or phone..."
                prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable
                style="max-width: 320px" @update:model-value="currentPage = 1" />

            <v-btn-toggle v-model="genderFilter" density="compact" variant="tonal" divided mandatory color="primary"
                class="flex-wrap" @update:model-value="currentPage = 1">
                <v-btn v-for="g in genderOptions" :key="g.value" :value="g.value" size="small">
                    {{ g.label }}
                </v-btn>
            </v-btn-toggle>
        </div>

        <v-divider />

        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Patient</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">No. RM</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Gender / Age</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Phone</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Email</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Blood Type</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Length of Stay</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Account</th>
                    <th class="text-no-wrap text-right text-caption font-weight-bold text-uppercase">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending" v-for="i in 5" :key="i">
                    <td colspan="9" style="border-bottom: none;">
                        <v-skeleton-loader type="table-row" class="my-1" />
                    </td>
                </tr>
                <tr v-else-if="patients.length === 0">
                    <td colspan="9" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-account-injury-outline" size="32" class="mb-2 d-block mx-auto" />
                        No patients found
                    </td>
                </tr>
                <tr v-else v-for="patient in patients" :key="patient.id">
                    <td class="py-3">
                        <div class="d-flex align-center ga-3">
                            <v-avatar size="34" color="secondary" variant="tonal">
                                <span class="text-caption font-weight-bold">{{ getInitials(patient.full_name) }}</span>
                            </v-avatar>
                            <div>
                                <div class="text-body-2 font-weight-medium"
                                    style="display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">
                                    {{ patient.full_name }}</div>
                                <div class="text-caption text-medium-emphasis"
                                    style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                                    {{ patient.address }}</div>
                            </div>
                        </div>
                    </td>
                    <td class="py-3">
                        <v-chip size="small" variant="tonal" color="primary" label>
                            {{ patient.medical_record_number }}
                        </v-chip>
                    </td>
                    <td class="py-3 text-body-2 text-medium-emphasis">
                        <span class="text-capitalize">{{ patient.gender ?? '-' }}</span>
                        <template v-if="calculateAge(patient.date_of_birth) !== null">
                            · {{ calculateAge(patient.date_of_birth) }} yo
                        </template>
                    </td>
                    <td class="py-3 text-body-2 text-medium-emphasis">{{ patient.phone }}</td>
                    <td class="py-3 text-body-2 text-medium-emphasis">{{ patient.email || '-' }}</td>
                    <td class="py-3">
                        <v-chip v-if="patient.blood_type" size="small" variant="tonal"
                            :color="bloodTypeColors[patient.blood_type] ?? 'secondary'">
                            {{ patient.blood_type }}
                        </v-chip>
                        <span v-else class="text-medium-emphasis">-</span>
                    </td>
                    <td class="py-3 text-body-2 text-medium-emphasis">{{ patient.length_of_stay || '-' }}</td>
                    <td class="py-3">
                        <v-chip :color="patient.has_account ? 'success' : 'default'" variant="tonal" size="small">
                            {{ patient.has_account ? 'Registered' : 'Walk-in' }}
                        </v-chip>
                    </td>
                    <td class="py-3 text-right">
                        <v-btn v-if="can('patient.edit')" icon="mdi-pencil-outline" variant="text" size="small"
                            color="secondary" density="comfortable" @click="openEdit(patient)" />
                        <v-btn v-if="can('patient.delete')" icon="mdi-delete-outline" variant="text" size="small"
                            color="error" density="comfortable" @click="openDelete(patient)" />
                    </td>
                </tr>
            </tbody>
        </v-table>

        <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
                Showing {{ patients.length }} of {{ totalPatients }} patients
            </span>
            <v-pagination v-if="totalPages > 1" v-model="currentPage" :length="totalPages" density="compact"
                size="small" />
        </div>
    </UiTitleCard>

    <v-dialog v-model="dialog" max-width="600">
        <PatientModal :mode="modalMode" :patient="selectedPatient" :loading="loading" @submit="handleSubmit"
            @cancel="closeModal" />
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" timeout="3000">
        {{ snackbarMsg }}
        <template #actions>
            <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
        </template>
    </v-snackbar>
</template>