<script setup lang="ts">
import useNurseWorkspace from '~/composables/useNurseWorkspace'

definePageMeta({
    layout: 'nurse',
    middleware: 'auth',
})

useSeoMeta({
    title: 'Vital Sign Entry',
    ogTitle: 'Vital Sign Entry',
    description: 'Enter blood pressure, temperature, weight, height, and pulse.',
})

const workspace = useNurseWorkspace()
const patientOptions = computed(() => workspace.patientOptions.value)
const recentVitals = computed(() => workspace.recentVitals.value.filter(Boolean))

const form = reactive({
    patientId: workspace.selectedPatientId.value || patientOptions.value[0]?.value || '',
    bloodPressure: '',
    temperature: '',
    weight: '',
    height: '',
    pulse: '',
    notes: '',
})

function submitVital() {
    if (!form.patientId) return

    workspace.addVital({
        patientId: form.patientId,
        bloodPressure: form.bloodPressure,
        temperature: form.temperature,
        weight: form.weight,
        height: form.height,
        pulse: form.pulse,
        notes: form.notes,
    })

    form.bloodPressure = ''
    form.temperature = ''
    form.weight = ''
    form.height = ''
    form.pulse = ''
    form.notes = ''
}
</script>

<template>
    <v-row>
        <v-col cols="12" lg="5">
            <v-card elevation="0">
                <v-card-item class="pb-2">
                    <v-card-title class="text-h5">Vital Sign Entry</v-card-title>
                    <v-card-subtitle>Complete the patient assessment data</v-card-subtitle>
                </v-card-item>

                <v-divider />

                <v-card-text>
                    <v-form @submit.prevent="submitVital" class="d-flex flex-column ga-4">
                        <v-select v-model="form.patientId" :items="patientOptions" item-title="title" item-value="value" label="Patient" variant="outlined" density="comfortable" />
                        <v-text-field v-model="form.bloodPressure" label="Blood pressure" placeholder="120/80" variant="outlined" density="comfortable" />
                        <v-text-field v-model="form.temperature" label="Temperature" placeholder="36.8" suffix="°C" variant="outlined" density="comfortable" />
                        <div class="d-flex ga-3">
                            <v-text-field v-model="form.weight" label="Weight" placeholder="60" suffix="kg" variant="outlined" density="comfortable" />
                            <v-text-field v-model="form.height" label="Height" placeholder="165" suffix="cm" variant="outlined" density="comfortable" />
                        </div>
                        <v-text-field v-model="form.pulse" label="Pulse" placeholder="78" suffix="bpm" variant="outlined" density="comfortable" />
                        <v-textarea v-model="form.notes" label="Short note" rows="3" variant="outlined" density="comfortable" />
                        <v-btn type="submit" color="primary" variant="flat">Save vital signs</v-btn>
                    </v-form>
                </v-card-text>
            </v-card>
        </v-col>

        <v-col cols="12" lg="7">
            <v-card elevation="0">
                <v-card-item class="pb-2">
                    <v-card-title class="text-h5">Vital Sign History</v-card-title>
                    <v-card-subtitle>Latest recorded entries</v-card-subtitle>
                </v-card-item>

                <v-divider />

                <v-table hover density="comfortable">
                    <thead class="bg-containerBg">
                        <tr>
                            <th class="text-left text-caption font-weight-bold text-uppercase">Patient</th>
                            <th class="text-left text-caption font-weight-bold text-uppercase">Vitals</th>
                            <th class="text-left text-caption font-weight-bold text-uppercase">Note</th>
                            <th class="text-right text-caption font-weight-bold text-uppercase">Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, index) in recentVitals" :key="item?.id ?? index">
                            <template v-if="item">
                            <td class="py-3">
                                <div class="text-body-2 font-weight-medium">{{ item.patientName }}</div>
                                <div class="text-caption text-medium-emphasis">{{ item.patientId }}</div>
                            </td>
                            <td class="py-3 text-body-2">
                                <div>BP: {{ item.bloodPressure }}</div>
                                <div>Temp: {{ item.temperature }}°C | Pulse: {{ item.pulse }}</div>
                                <div>Wt/Ht: {{ item.weight }} kg / {{ item.height }} cm</div>
                            </td>
                            <td class="py-3 text-body-2 text-medium-emphasis">{{ item.notes }}</td>
                            <td class="py-3 text-right text-caption text-medium-emphasis">
                                {{ new Date(item.recordedAt).toLocaleString('en-US') }}
                            </td>
                            </template>
                        </tr>
                        <tr v-if="recentVitals.length === 0">
                            <td colspan="4" class="text-center py-8 text-medium-emphasis">No vital signs recorded yet</td>
                        </tr>
                    </tbody>
                </v-table>
            </v-card>
        </v-col>
    </v-row>
</template>

