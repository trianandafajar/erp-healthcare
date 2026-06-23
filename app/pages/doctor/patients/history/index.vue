<script setup lang="ts">
definePageMeta({
    layout: 'doctor',
    middleware: ['auth', 'permission'],
    permissions: ['patient-history.view'],
})

interface Patient {
    id: string
    full_name: string
    medical_record_number: string
    gender: string | null
    phone: string
}

const search = ref('')

const { data, pending } = await useFetch<{ patients: any[] }>('/api/patients')

const patients = computed<Patient[]>(() =>
    (data.value?.patients ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name ?? '-',
        medical_record_number: p.medical_record_number ?? '-',
        gender: p.gender ?? null,
        phone: p.phone ?? '-',
    }))
)

const filteredPatients = computed(() =>
    patients.value.filter((p) =>
        p.full_name.toLowerCase().includes(search.value.toLowerCase()) ||
        p.medical_record_number.toLowerCase().includes(search.value.toLowerCase())
    )
)

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function openHistory(patientId: string) {
    navigateTo(`/doctor/patients/${patientId}/history`)
}
</script>

<template>
    <v-row>
        <v-col cols="12">
            <v-card-item class="pb-2 px-0 pt-0">
                <v-card-title class="text-h3">Patient History</v-card-title>
                <v-card-subtitle class="mt-1">Select a patient to view their complete activity
                    timeline</v-card-subtitle>
            </v-card-item>
        </v-col>

        <v-col cols="12">
            <v-card>
                <div class="px-4 py-3">
                    <v-text-field v-model="search" placeholder="Search by name or RM number..."
                        prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable
                        style="max-width: 320px" />
                </div>

                <v-divider />

                <v-table hover density="comfortable">
                    <thead class="bg-containerBg">
                        <tr>
                            <th class="text-left text-caption font-weight-bold text-uppercase">No. RM</th>
                            <th class="text-left text-caption font-weight-bold text-uppercase">Patient</th>
                            <th class="text-left text-caption font-weight-bold text-uppercase">Gender</th>
                            <th class="text-left text-caption font-weight-bold text-uppercase">Phone</th>
                            <th class="text-right text-caption font-weight-bold text-uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="pending">
                            <td colspan="5" class="text-center py-8">
                                <v-progress-circular indeterminate color="primary" />
                            </td>
                        </tr>
                        <tr v-else-if="filteredPatients.length === 0">
                            <td colspan="5" class="text-center py-8 text-medium-emphasis">
                                <v-icon icon="mdi-account-search" size="32" class="mb-2 d-block mx-auto" />
                                No patients found
                            </td>
                        </tr>
                        <tr v-else v-for="patient in filteredPatients" :key="patient.id">
                            <td class="py-3">
                                <v-chip size="small" variant="tonal" color="primary" label>
                                    {{ patient.medical_record_number }}
                                </v-chip>
                            </td>
                            <td class="py-3">
                                <div class="d-flex align-center ga-3">
                                    <v-avatar size="34" color="secondary" variant="tonal">
                                        <span class="text-caption font-weight-bold">{{ getInitials(patient.full_name)
                                            }}</span>
                                    </v-avatar>
                                    <span class="text-body-2 font-weight-medium">{{ patient.full_name }}</span>
                                </div>
                            </td>
                            <td class="py-3 text-body-2 text-medium-emphasis text-capitalize">
                                {{ patient.gender ?? '-' }}
                            </td>
                            <td class="py-3 text-body-2 text-medium-emphasis">
                                {{ patient.phone }}
                            </td>
                            <td class="py-3 text-right">
                                <v-btn variant="tonal" color="primary" size="small" prepend-icon="mdi-history"
                                    @click="openHistory(patient.id)">
                                    View History
                                </v-btn>
                            </td>
                        </tr>
                    </tbody>
                </v-table>
            </v-card>
        </v-col>
    </v-row>
</template>