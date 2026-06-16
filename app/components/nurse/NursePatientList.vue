<script setup lang="ts">
import { ref, computed } from 'vue'

type NursePatient = {
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
    status: string | null
    has_account: boolean
    created_at: string
    updated_at: string
}

const search = ref('')
const genderFilter = ref('all')
const currentPage = ref(1)
const itemsPerPage = 10

const { data, pending, refresh } = await useFetch<{ patients: NursePatient[] }>('/api/nurse/patients')

const patients = computed(() => data.value?.patients ?? [])

const genderOptions = [
    { label: 'All', value: 'all' },
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
]

const filteredPatients = computed(() => {
    const keyword = search.value.toLowerCase()

    return patients.value.filter((patient) => {
        const matchGender = genderFilter.value === 'all' || patient.gender === genderFilter.value
        const matchSearch =
            patient.full_name.toLowerCase().includes(keyword) ||
            patient.medical_record_number.toLowerCase().includes(keyword) ||
            patient.phone.toLowerCase().includes(keyword)

        return matchGender && matchSearch
    })
})

const paginatedPatients = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    return filteredPatients.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() => Math.ceil(filteredPatients.value.length / itemsPerPage))

function getInitials(name: string) {
    return name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
}

function formatDate(dateStr?: string) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

function calculateAge(dateStr?: string) {
    if (!dateStr) return null
    const dob = new Date(dateStr)
    const diff = Date.now() - dob.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

function onSearch() {
    currentPage.value = 1
}

function onGenderChange() {
    currentPage.value = 1
}
</script>

<template>
    <v-card elevation="0" class="mb-4 bg-transparent">
        <v-card-text class="d-flex flex-wrap align-center justify-space-between ga-4 bg-transparent">
            <div>
                <div class="text-caption text-uppercase text-medium-emphasis">Nurse Care</div>
                <h3 class="text-h4 mb-1">Patient List</h3>
                <p class="text-body-2 text-medium-emphasis mb-0">Live patient records from the database.</p>
            </div>
        </v-card-text>
    </v-card>

    <v-card elevation="0">
        <div class="d-flex align-center p-4 ga-3 flex-wrap justify-space-between" style="flex: 1 1 560px">
            <v-text-field v-model="search" density="comfortable" hide-details
                placeholder="Search by name, MRN, or phone..." prepend-inner-icon="mdi-magnify" variant="outlined"
                clearable style="min-width: 340px; max-width: 420px; flex: 1 1 360px" @update:model-value="onSearch" />
            <div class="d-flex align-center ga-2">
                <v-btn-toggle v-model="genderFilter" density="comfortable" variant="tonal" divided mandatory
                    color="primary" class="flex-wrap" @update:model-value="onGenderChange">
                    <v-btn v-for="option in genderOptions" :key="option.value" :value="option.value" size="default">
                        {{ option.label }}
                    </v-btn>
                </v-btn-toggle>
                <v-btn icon="mdi-refresh" variant="text" color="primary" size="default" :loading="pending"
                    @click="refresh" />
            </div>

        </div>
        <v-table hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Patient</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">MRN</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Gender / Age</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Phone</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Blood Type</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Status</th>
                    <th class="text-right text-caption font-weight-bold text-uppercase">Registered</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending">
                    <td colspan="7" class="text-center py-8">
                        <v-progress-circular indeterminate color="primary" />
                    </td>
                </tr>
                <tr v-else-if="paginatedPatients.length === 0">
                    <td colspan="7" class="text-center py-8 text-medium-emphasis">
                        No patients found
                    </td>
                </tr>
                <tr v-else v-for="patient in paginatedPatients" :key="patient.id">
                    <td class="py-3">
                        <div class="d-flex align-center ga-3">
                            <v-avatar size="34" color="secondary" variant="tonal">
                                <span class="text-caption font-weight-bold">{{ getInitials(patient.full_name) }}</span>
                            </v-avatar>
                            <div>
                                <div class="text-body-2 font-weight-medium">{{ patient.full_name }}</div>
                                <div class="text-caption text-medium-emphasis">{{ patient.address }}</div>
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
                            - {{ calculateAge(patient.date_of_birth) }} yo
                        </template>
                    </td>
                    <td class="py-3 text-body-2 text-medium-emphasis">
                        {{ patient.phone }}
                    </td>
                    <td class="py-3">
                        <v-chip v-if="patient.blood_type" size="small" variant="tonal" color="secondary">
                            {{ patient.blood_type }}
                        </v-chip>
                        <span v-else class="text-medium-emphasis">-</span>
                    </td>
                    <td class="py-3">
                        <v-chip :color="patient.status === 'active' ? 'success' : 'default'" variant="tonal"
                            size="small">
                            {{ patient.status ?? 'Unknown' }}
                        </v-chip>
                    </td>
                    <td class="py-3 text-right text-caption text-medium-emphasis">
                        {{ formatDate(patient.created_at) }}
                    </td>
                </tr>
            </tbody>
        </v-table>

        <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
                Showing {{ paginatedPatients.length }} of {{ filteredPatients.length }} patients
            </span>
            <v-pagination v-if="totalPages > 1" v-model="currentPage" :length="totalPages" density="compact"
                size="small" />
        </div>
    </v-card>
</template>
