<script setup lang="ts">
import useNurseWorkspace from '~/composables/useNurseWorkspace'

const workspace = useNurseWorkspace()
const patientOptions = computed(() => workspace.patientOptions.value)
const monitoringItems = computed(() => workspace.monitoringItems.value.filter(Boolean))

const form = reactive({
    patientId: workspace.selectedPatientId.value || patientOptions.value[0]?.value || '',
    observation: '',
    status: 'Observe' as 'Stable' | 'Observe' | 'Urgent',
})

function submitMonitoring() {
    if (!form.patientId || !form.observation.trim()) return

    workspace.addMonitoring({
        patientId: form.patientId,
        observation: form.observation,
        status: form.status,
    })

    form.observation = ''
    form.status = 'Observe'
}
</script>

<template>
    <v-row>
        <v-col cols="12" lg="5">
            <v-card elevation="0">
                <v-card-item class="pb-2">
                    <v-card-title class="text-h5">Patient Monitoring</v-card-title>
                    <v-card-subtitle>Add the latest observation status</v-card-subtitle>
                </v-card-item>
                <v-divider />
                <v-card-text>
                    <v-form @submit.prevent="submitMonitoring" class="d-flex flex-column ga-4">
                        <v-select v-model="form.patientId" :items="patientOptions" item-title="title" item-value="value" label="Patient" variant="outlined" density="comfortable" />
                        <v-textarea v-model="form.observation" label="Observation" rows="4" variant="outlined" density="comfortable" />
                        <v-select v-model="form.status" :items="['Stable', 'Observe', 'Urgent']" label="Status" variant="outlined" density="comfortable" />
                        <v-btn type="submit" color="primary" variant="flat">Save monitoring</v-btn>
                    </v-form>
                </v-card-text>
            </v-card>
        </v-col>
        <v-col cols="12" lg="7">
            <v-card elevation="0">
                <v-card-item class="pb-2">
                    <v-card-title class="text-h5">Monitoring List</v-card-title>
                    <v-card-subtitle>Patients currently under observation</v-card-subtitle>
                </v-card-item>
                <v-divider />
                <v-card-text class="d-flex flex-column ga-4">
                    <v-card v-for="(item, index) in monitoringItems" :key="item?.id ?? index" variant="tonal">
                        <template v-if="item">
                            <v-card-text>
                                <div class="d-flex align-center justify-space-between ga-3 mb-2">
                                    <div>
                                        <div class="text-body-2 font-weight-medium">{{ item.patientName }}</div>
                                        <div class="text-caption text-medium-emphasis">{{ new Date(item.lastUpdate).toLocaleString('en-US') }}</div>
                                    </div>
                                    <v-chip size="small" variant="tonal" :color="item.status === 'Urgent' ? 'error' : item.status === 'Observe' ? 'warning' : 'success'">
                                        {{ item.status }}
                                    </v-chip>
                                </div>
                                <div class="text-body-2">{{ item.observation }}</div>
                            </v-card-text>
                        </template>
                    </v-card>
                    <div v-if="monitoringItems.length === 0" class="text-center py-8 text-medium-emphasis">
                        No patients are being monitored
                    </div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>
</template>
