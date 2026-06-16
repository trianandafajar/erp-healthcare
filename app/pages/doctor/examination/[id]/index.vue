<script setup lang="ts">
definePageMeta({
    layout: 'doctor',
    middleware: 'auth'
})

interface Patient {
    id: string
    full_name: string
    medical_record_number: string
    gender: string
}

interface AppointmentResponse {
    appointment: {
        patients: Patient | null
    } | null
}

interface Prescription {
    medication_name: string
    dosage: string
    frequency: string
    duration: string
    instructions: string
}

const route = useRoute()

const { data, pending } = await useFetch<AppointmentResponse>(
    `/api/doctor/examinations/${route.params.id as string}`
)

const appointment = computed(() => data.value?.appointment)
const patient = computed(() => appointment.value?.patients)

const form = reactive({
    blood_pressure: '' as string,
    heart_rate: null as number | null,
    temperature: null as number | null,
    weight: null as number | null,
    height: null as number | null,

    subjective: '' as string,
    objective: '' as string,
    diagnosis: '' as string,
    icd10_code: '' as string,
    treatment_plan: '' as string,
    notes: '' as string,
})

const prescriptions = ref<Prescription[]>([
    {
        medication_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
    },
])

function addMedicine() {
    prescriptions.value.push({
        medication_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
    })
}

function removeMedicine(index: number) {
    prescriptions.value.splice(index, 1)
}

function getInitials(name?: string | null): string {
    if (!name) return '?'
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
}

const saving = ref(false)

const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('success')

function notify(msg: string, color = 'success') {
    snackbarMsg.value = msg
    snackbarColor.value = color
    snackbar.value = true
}

async function saveExamination() {
    try {
        saving.value = true

        await $fetch('/api/doctor/medical-records', {
            method: 'POST',
            body: {
                appointment_id: route.params.id,
                patient_id: patient.value?.id,

                blood_pressure: form.blood_pressure,
                temperature: form.temperature,
                heart_rate: form.heart_rate,
                weight: form.weight,
                height: form.height,

                subjective: form.subjective,
                objective: form.objective,
                diagnosis: form.diagnosis,
                icd10_code: form.icd10_code,
                treatment_plan: form.treatment_plan,
                notes: form.notes,

                prescriptions: prescriptions.value
            }
        })

        notify('Examination saved successfully')

        setTimeout(() => {
            navigateTo('/doctor/medical-records')
        }, 1000)
    }
    catch (error: any) {
        console.error(error)

        notify(
            error?.data?.message ??
            error?.message ??
            'Failed to save examination',
            'error'
        )
    }
    finally {
        saving.value = false
    }
}
</script>

<template>
    <v-row>
        <v-col cols="12">
            <v-card>
                <v-card-item class="pb-2">
                    <div class="d-flex justify-space-between align-center">
                        <div>
                            <v-card-title class="text-h3">Patient Examination</v-card-title>
                            <v-card-subtitle class="mt-1">
                                Complete the patient's medical assessment and treatment plan
                            </v-card-subtitle>
                        </div>
                        <v-chip color="secondary" variant="tonal" size="small" prepend-icon="mdi-calendar-clock">
                            Current Visit
                        </v-chip>
                    </div>
                </v-card-item>
            </v-card>
        </v-col>

        <v-col cols="12">
            <v-card>
                <v-card-item>
                    <div class="d-flex justify-space-between align-center">
                        <v-card-title>Patient Information</v-card-title>
                        <div v-if="patient" class="d-flex align-center ga-3">
                            <v-avatar size="34" color="primary" variant="tonal">
                                <span class="text-caption font-weight-bold">
                                    {{ getInitials(patient.full_name ?? '') }}
                                </span>
                            </v-avatar>
                            <div>
                                <div class="text-body-2 font-weight-medium">
                                    {{ patient.full_name ?? '-' }}
                                </div>
                                <div class="text-caption text-medium-emphasis">
                                    {{ patient.medical_record_number ?? '-' }}
                                </div>
                            </div>
                            <v-chip v-if="patient.gender" size="small" variant="tonal" color="info" label>
                                {{ patient.gender }}
                            </v-chip>
                        </div>
                    </div>
                </v-card-item>

                <v-divider />

                <v-card-text>
                    <v-row>
                        <v-col cols="12" md="4">
                            <v-text-field label="Patient Name" :model-value="patient?.full_name" readonly
                                density="comfortable" variant="outlined" />
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-text-field label="Medical Record Number" :model-value="patient?.medical_record_number"
                                readonly density="comfortable" variant="outlined" />
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-text-field label="Gender" :model-value="patient?.gender" readonly density="comfortable"
                                variant="outlined" />
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
        </v-col>

        <!-- vital signs -->
        <v-col cols="12">
            <v-card>
                <v-card-item>
                    <div class="d-flex justify-space-between align-center">
                        <v-card-title>Vital Signs</v-card-title>
                        <v-chip size="small" variant="tonal" color="secondary" prepend-icon="mdi-heart-pulse">
                            Current visit
                        </v-chip>
                    </div>
                </v-card-item>

                <v-divider />

                <v-card-text>
                    <v-row>
                        <v-col cols="12" md="4">
                            <v-text-field v-model="form.blood_pressure" label="Blood Pressure" placeholder="120/80"
                                density="comfortable" variant="outlined" />
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-text-field v-model="form.heart_rate" label="Heart Rate" type="number" suffix="bpm"
                                density="comfortable" variant="outlined" />
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-text-field v-model="form.temperature" label="Temperature" type="number" suffix="°C"
                                density="comfortable" variant="outlined" />
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-text-field v-model="form.weight" label="Weight" type="number" suffix="kg"
                                density="comfortable" variant="outlined" />
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-text-field v-model="form.height" label="Height" type="number" suffix="cm"
                                density="comfortable" variant="outlined" />
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
        </v-col>

        <!-- SOAP -->
        <v-col cols="12">
            <v-card>
                <v-card-item>
                    <div class="d-flex justify-space-between align-center">
                        <v-card-title>Medical Assessment (SOAP)</v-card-title>
                        <v-chip size="small" variant="tonal" color="secondary">
                            SOAP format
                        </v-chip>
                    </div>
                </v-card-item>

                <v-divider />

                <v-card-text>
                    <v-row>
                        <v-col cols="12">
                            <v-textarea v-model="form.subjective" label="Subjective"
                                placeholder="Patient's reported symptoms and complaints..." rows="3"
                                density="comfortable" variant="outlined" />
                        </v-col>

                        <v-col cols="12">
                            <v-textarea v-model="form.objective" label="Objective"
                                placeholder="Observable, measurable findings..." rows="3" density="comfortable"
                                variant="outlined" />
                        </v-col>

                        <v-col cols="12" md="9">
                            <v-textarea v-model="form.diagnosis" label="Diagnosis" placeholder="Clinical diagnosis..."
                                rows="3" density="comfortable" variant="outlined" />
                        </v-col>

                        <v-col cols="12" md="3">
                            <v-text-field v-model="form.icd10_code" label="ICD-10 Code" placeholder="e.g. J06.9"
                                density="comfortable" variant="outlined" />
                        </v-col>

                        <v-col cols="12">
                            <v-textarea v-model="form.treatment_plan" label="Treatment Plan"
                                placeholder="Planned treatment and interventions..." rows="3" density="comfortable"
                                variant="outlined" />
                        </v-col>

                        <v-col cols="12">
                            <v-textarea v-model="form.notes" label="Clinical Notes" placeholder="Additional notes..."
                                rows="3" density="comfortable" variant="outlined" />
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
        </v-col>

        <!-- prescriptions -->
        <v-col cols="12">
            <v-card>
                <v-card-item>
                    <div class="d-flex justify-space-between align-center">
                        <v-card-title>Prescriptions</v-card-title>
                        <v-btn color="primary" variant="flat" size="small" prepend-icon="mdi-plus" density="comfortable"
                            @click="addMedicine">
                            Add Medicine
                        </v-btn>
                    </div>
                </v-card-item>

                <v-divider />

                <v-card-text class="px-0 pb-0">
                    <v-table hover density="comfortable">
                        <thead class="bg-containerBg">
                            <tr>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Medicine</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Dosage</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Frequency</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Duration</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Instructions</th>
                                <th class="text-right text-caption font-weight-bold text-uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(medicine, index) in prescriptions" :key="index">
                                <td class="py-2" style="min-width: 160px;">
                                    <v-text-field v-model="medicine.medication_name" placeholder="Medication name"
                                        density="compact" variant="outlined" hide-details />
                                </td>
                                <td class="py-2" style="min-width: 110px;">
                                    <v-text-field v-model="medicine.dosage" placeholder="e.g. 500mg" density="compact"
                                        variant="outlined" hide-details />
                                </td>
                                <td class="py-2" style="min-width: 120px;">
                                    <v-text-field v-model="medicine.frequency" placeholder="e.g. 3×/day"
                                        density="compact" variant="outlined" hide-details />
                                </td>
                                <td class="py-2" style="min-width: 110px;">
                                    <v-text-field v-model="medicine.duration" placeholder="e.g. 5 days"
                                        density="compact" variant="outlined" hide-details />
                                </td>
                                <td class="py-2" style="min-width: 160px;">
                                    <v-text-field v-model="medicine.instructions" placeholder="e.g. after meal"
                                        density="compact" variant="outlined" hide-details />
                                </td>
                                <td class="py-2 text-right">
                                    <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error"
                                        density="comfortable" :disabled="prescriptions.length === 1"
                                        @click="removeMedicine(index)" />
                                </td>
                            </tr>
                        </tbody>
                    </v-table>

                    <div class="px-4 py-2">
                        <span class="text-caption text-medium-emphasis">
                            {{ prescriptions.length }} medicine(s) added
                        </span>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>
        <v-col cols="12">
            <div class="d-flex justify-end ga-3">
                <v-btn variant="outlined">
                    Cancel
                </v-btn>
                <v-btn color="primary" variant="flat" prepend-icon="mdi-content-save" :loading="saving"
                    @click="saveExamination">
                    Save Examination
                </v-btn>
            </div>
        </v-col>
    </v-row>
    <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" :timeout="3000">
        {{ snackbarMsg }}

        <template #actions>
            <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
        </template>
    </v-snackbar>
</template>