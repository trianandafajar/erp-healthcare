<script setup lang="ts">
import useNurseWorkspace from '~/composables/useNurseWorkspace'

const workspace = useNurseWorkspace()
const patientOptions = computed(() => workspace.patientOptions.value)
const upcomingProcedures = computed(() => workspace.upcomingProcedures.value.filter(Boolean))

const form = reactive({
    patientId: workspace.selectedPatientId.value || patientOptions.value[0]?.value || '',
    procedure: '',
    scheduledAt: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High',
    status: 'Planned' as 'Planned' | 'In Progress' | 'Completed',
})

function submitProcedure() {
    if (!form.patientId || !form.procedure.trim()) return

    workspace.addProcedure({
        patientId: form.patientId,
        procedure: form.procedure,
        scheduledAt: form.scheduledAt || new Date().toISOString(),
        priority: form.priority,
        status: form.status,
    })

    form.procedure = ''
    form.scheduledAt = ''
    form.priority = 'Medium'
    form.status = 'Planned'
}
</script>

<template>
    <v-row>
        <v-col cols="12" lg="5">
            <v-card elevation="0">
                <v-card-item class="pb-2">
                    <v-card-title class="text-h5">Procedure Schedule</v-card-title>
                    <v-card-subtitle>Plan patient procedures</v-card-subtitle>
                </v-card-item>
                <v-divider />
                <v-card-text>
                    <v-form @submit.prevent="submitProcedure" class="d-flex flex-column ga-4">
                        <v-select v-model="form.patientId" :items="patientOptions" item-title="title" item-value="value" label="Patient" variant="outlined" density="comfortable" />
                        <v-text-field v-model="form.procedure" label="Procedure name" variant="outlined" density="comfortable" />
                        <v-text-field v-model="form.scheduledAt" label="Schedule" type="datetime-local" variant="outlined" density="comfortable" />
                        <div class="d-flex ga-3">
                            <v-select v-model="form.priority" :items="['Low', 'Medium', 'High']" label="Priority" variant="outlined" density="comfortable" />
                            <v-select v-model="form.status" :items="['Planned', 'In Progress', 'Completed']" label="Status" variant="outlined" density="comfortable" />
                        </div>
                        <v-btn type="submit" color="primary" variant="flat">Save schedule</v-btn>
                    </v-form>
                </v-card-text>
            </v-card>
        </v-col>
        <v-col cols="12" lg="7">
            <v-card elevation="0">
                <v-card-item class="pb-2">
                    <v-card-title class="text-h5">Procedure List</v-card-title>
                    <v-card-subtitle>Scheduled procedures and treatments</v-card-subtitle>
                </v-card-item>
                <v-divider />
                <v-table hover density="comfortable">
                    <thead class="bg-containerBg">
                        <tr>
                            <th class="text-left text-caption font-weight-bold text-uppercase">Patient</th>
                            <th class="text-left text-caption font-weight-bold text-uppercase">Procedure</th>
                            <th class="text-left text-caption font-weight-bold text-uppercase">Priority</th>
                            <th class="text-left text-caption font-weight-bold text-uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, index) in upcomingProcedures" :key="item?.id ?? index">
                            <template v-if="item">
                                <td class="py-3">
                                    <div class="text-body-2 font-weight-medium">{{ item.patientName }}</div>
                                    <div class="text-caption text-medium-emphasis">{{ new Date(item.scheduledAt).toLocaleString('en-US') }}</div>
                                </td>
                                <td class="py-3">{{ item.procedure }}</td>
                                <td class="py-3">
                                    <v-chip size="small" variant="tonal" :color="item.priority === 'High' ? 'error' : item.priority === 'Medium' ? 'warning' : 'success'">
                                        {{ item.priority }}
                                    </v-chip>
                                </td>
                                <td class="py-3">
                                    <v-chip size="small" variant="tonal" color="primary">
                                        {{ item.status }}
                                    </v-chip>
                                </td>
                            </template>
                        </tr>
                        <tr v-if="upcomingProcedures.length === 0">
                            <td colspan="4" class="text-center py-8 text-medium-emphasis">No procedures scheduled yet</td>
                        </tr>
                    </tbody>
                </v-table>
            </v-card>
        </v-col>
    </v-row>
</template>
