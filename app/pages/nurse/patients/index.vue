<script setup lang="ts">
import useNurseWorkspace from '~/composables/useNurseWorkspace'

definePageMeta({
    layout: 'nurse',
    middleware: 'auth',
})

useSeoMeta({
    title: 'Patient List',
    ogTitle: 'Patient List',
    description: 'Patients currently monitored by the nurse team.',
})

const workspace = useNurseWorkspace()
const search = ref('')

const filteredPatients = computed(() =>
    workspace.patients.value.filter((patient) =>
        [patient.name, patient.mrn, patient.department, patient.room, patient.status]
            .join(' ')
            .toLowerCase()
            .includes(search.value.toLowerCase()),
    ),
)

function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    })
}
</script>

<template>
    <v-card elevation="0" class="mb-4">
        <v-card-text class="d-flex flex-wrap align-center justify-space-between ga-4">
            <div>
                <div class="text-caption text-uppercase text-medium-emphasis">Nurse Care</div>
                <h3 class="text-h4 mb-1">Patient List</h3>
                <p class="text-body-2 text-medium-emphasis mb-0">Patients currently active under nurse monitoring.</p>
            </div>
            <v-text-field v-model="search" density="compact" hide-details placeholder="Search patients..." variant="outlined" style="max-width: 280px" />
        </v-card-text>
    </v-card>

    <v-card elevation="0">
        <v-table hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Patient</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Room</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Status</th>
                    <th class="text-right text-caption font-weight-bold text-uppercase">Update</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="patient in filteredPatients" :key="patient.id">
                    <td class="py-3">
                        <div class="text-body-2 font-weight-medium">{{ patient.name }}</div>
                        <div class="text-caption text-medium-emphasis">{{ patient.mrn }}</div>
                    </td>
                    <td class="py-3">{{ patient.department }} - {{ patient.room }}</td>
                    <td class="py-3">
                        <v-chip size="small" variant="tonal" :color="patient.status === 'critical' ? 'error' : patient.status === 'watch' ? 'warning' : 'success'">
                            {{ patient.status }}
                        </v-chip>
                    </td>
                    <td class="py-3 text-right text-caption text-medium-emphasis">
                        {{ formatTime(patient.lastUpdated) }}
                    </td>
                </tr>
                <tr v-if="filteredPatients.length === 0">
                    <td colspan="4" class="text-center py-8 text-medium-emphasis">No patients found</td>
                </tr>
            </tbody>
        </v-table>
    </v-card>
</template>

