<script setup lang="ts">
import ReferralModal from '~/components/doctor/referal/ReferralModal.vue'

definePageMeta({
    layout: 'doctor',
    middleware: ['auth', 'permission'],
    permissions: ['examination.view'],
})

const { can } = usePermission()

useSeoMeta({
    title: 'Examination Input Page',
    ogTitle: 'My Amazing Site',
    description: 'This is my amazing site, let me tell you all about it.',
    ogDescription: 'This is my amazing site, let me tell you all about it.',
    ogImage: 'https://example.com/image.png',
    twitterCard: 'summary_large_image',
})

interface Patient {
    id: string
    full_name: string
    medical_record_number: string
    gender: string
}

interface AppointmentResponse {
    appointment: {
        doctor_id: string
        patients: Patient | null
    } | null
}

interface Prescription {
    medicine_id: string
    medicine_name: string
    dosage: string
    frequency: string
    duration: string
    instructions: string
}

interface ExaminationAttachment {
    title: string
    category: string
    file: File | null
}

const route = useRoute()

const { data, pending } = await useFetch<AppointmentResponse>(
    `/api/doctor/examinations/${route.params.id as string}`
)

const appointment = computed(() => data.value?.appointment)
const patient = computed(() => appointment.value?.patients)
const attachments = ref<ExaminationAttachment[]>([])

const { data: latestDoctorVitals } = await useLazyFetch<{
    vital: {
        blood_pressure: string
        temperature: number | null
        weight: number | null
        height: number | null
        heart_rate: number | null
    } | null
}>(() => {
    const patientId = patient.value?.id
    return patientId
        ? `/api/doctor/vitals/latest/${patientId}`
        : ''
})

const { data: deptData } = await useFetch<{ departments: any[] }>('/api/departments')
const { data: doctorsData } = await useFetch<{ doctors: any[] }>('/api/doctors')

const departments = computed(() => deptData.value?.departments ?? [])
const doctors = computed(() =>
    (doctorsData.value?.doctors ?? []).map((d: any) => ({
        id: d.id,
        full_name: d.full_name,
        department_id: d.department?.id ?? null
    }))
)

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

watch(
    () => patient.value?.id,
    () => {
        const vital = latestDoctorVitals.value?.vital ?? null
        if (!vital) return

        form.blood_pressure = vital.blood_pressure ?? ''

        form.temperature = vital.temperature ?? null
        form.weight = vital.weight ?? null
        form.height = vital.height ?? null
        form.heart_rate = vital.heart_rate ?? null
    },
    { immediate: true },
)

const prescriptions = ref<Prescription[]>([
    {
        medicine_id: '',
        medicine_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
    },
])

function addMedicine() {
    prescriptions.value.push({
        medicine_id: '',
        medicine_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
    })
}

function removeMedicine(index: number) {
    prescriptions.value.splice(index, 1)
}

function addAttachment() {
    attachments.value.push({
        title: '',
        category: 'document',
        file: null
    })
}

function removeAttachment(index: number) {
    attachments.value.splice(index, 1)
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

const isFormValid = computed(() => {
    return (
        form.subjective.trim().length > 0 &&
        form.objective.trim().length > 0 &&
        form.diagnosis.trim().length > 0 &&
        form.treatment_plan.trim().length > 0
    )
})

const saving = ref(false)
const referring = ref(false)
const referralDialog = ref(false)

const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('success')

function notify(msg: string, color = 'success') {
    snackbarMsg.value = msg
    snackbarColor.value = color
    snackbar.value = true
}

const { data: medicineData } = await useFetch<any[]>('/api/pharmacy/stocks')
const medicines = computed(() => medicineData.value ?? [])

function onMedicineSelect(medicineId: string, index: number) {
    const selected = medicines.value.find(m => m.id === medicineId)
    if (!selected) return

    const prescription = prescriptions.value[index]
    if (!prescription) return

    prescription.medicine_name = selected.medicine_name
    prescription.dosage = selected.dosage
}

async function submitExamination(): Promise<string | null> {
    try {
        const res: any = await $fetch('/api/doctor/medical-records', {
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

        return res?.medical_record?.id ?? null
    } catch (error: any) {
        notify(
            error?.data?.message ?? error?.message ?? 'Failed to save examination',
            'error'
        )
        return null
    }
}

async function saveExamination() {
    if (!isFormValid.value) {
        notify('Please complete all SOAP fields before saving', 'error')
        return
    }

    saving.value = true
    try {
        const medicalRecordId = await submitExamination()

        if (!medicalRecordId) return

        await uploadAttachments(
            medicalRecordId
        )

        notify('Examination saved successfully')

        setTimeout(() => {
            navigateTo('/doctor/medical-records')
        }, 1000)
    } finally {
        saving.value = false
    }
}

function openReferral() {
    if (!isFormValid.value) {
        notify('Please complete all SOAP fields before referring', 'error')
        return
    }
    referralDialog.value = true
}

async function handleReferralSubmit(payload: {
    to_department_id: string
    to_doctor_id: string | null
    reason: string
    notes: string
}) {
    referring.value = true
    try {
        const medicalRecordId = await submitExamination()
        if (!medicalRecordId) return

        console.log('referral payload check:', {
            medical_record_id: medicalRecordId,
            patient_id: patient.value?.id,
            from_doctor_id: appointment.value?.doctor_id,
            to_department_id: payload.to_department_id,
            reason: payload.reason,
        })

        await $fetch('/api/doctor/referrals', {
            method: 'POST',
            body: {
                medical_record_id: medicalRecordId,
                patient_id: patient.value?.id,
                from_doctor_id: appointment.value?.doctor_id,
                to_department_id: payload.to_department_id,
                to_doctor_id: payload.to_doctor_id,
                reason: payload.reason,
                notes: payload.notes,
            }
        })

        referralDialog.value = false
        notify('Examination saved and patient referred successfully')

        setTimeout(() => {
            navigateTo('/doctor/medical-records')
        }, 1000)
    } catch (error: any) {
        notify(
            error?.data?.message ?? error?.message ?? 'Failed to refer patient',
            'error'
        )
    } finally {
        referring.value = false
    }
}

async function uploadAttachments(
    medicalRecordId: string
) {
    for (const attachment of attachments.value) {
        if (!attachment.file) continue

        const formData = new FormData()

        formData.append(
            'medical_record_id',
            medicalRecordId
        )

        formData.append(
            'title',
            attachment.title
        )

        formData.append(
            'category',
            attachment.category
        )

        formData.append(
            'file',
            attachment.file
        )

        await $fetch(
            '/api/doctor/medical-record-files',
            {
                method: 'POST',
                body: formData
            }
        )
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
                            All fields required
                        </v-chip>
                    </div>
                </v-card-item>

                <v-divider />

                <v-card-text>
                    <v-row>
                        <v-col cols="12">
                            <v-textarea v-model="form.subjective" label="Subjective *"
                                placeholder="Patient's reported symptoms and complaints..." rows="3"
                                density="comfortable" variant="outlined" />
                        </v-col>

                        <v-col cols="12">
                            <v-textarea v-model="form.objective" label="Objective *"
                                placeholder="Observable, measurable findings..." rows="3" density="comfortable"
                                variant="outlined" />
                        </v-col>

                        <v-col cols="12" md="9">
                            <v-textarea v-model="form.diagnosis" label="Diagnosis *" placeholder="Clinical diagnosis..."
                                rows="3" density="comfortable" variant="outlined" />
                        </v-col>

                        <v-col cols="12" md="3">
                            <v-text-field v-model="form.icd10_code" label="ICD-10 Code" placeholder="e.g. J06.9"
                                density="comfortable" variant="outlined" />
                        </v-col>

                        <v-col cols="12">
                            <v-textarea v-model="form.treatment_plan" label="Treatment Plan *"
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
                        <v-btn color="primary" prepend-icon="mdi-plus" @click="addMedicine">
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
                                    <v-select v-model="medicine.medicine_id" :items="medicines"
                                        item-title="medicineName" item-value="id" label="Medicine" density="compact"
                                        variant="outlined" hide-details
                                        @update:model-value="(val) => onMedicineSelect(val, index)" />
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
            <v-card>
                <v-card-item>
                    <div class="d-flex justify-space-between align-center">
                        <div>
                            <v-card-title>
                                Examination Attachments
                            </v-card-title>

                            <v-card-subtitle>
                                Upload supporting documents such as laboratory results,
                                radiology reports, images, or other clinical documents
                            </v-card-subtitle>
                        </div>

                        <v-btn color="primary" prepend-icon="mdi-plus" @click="addAttachment">
                            Add Attachment
                        </v-btn>
                    </div>
                </v-card-item>

                <v-divider />

                <v-card-text>
                    <v-alert v-if="attachments.length === 0" type="info" variant="tonal">
                        No attachments added.
                    </v-alert>

                    <v-row v-for="(attachment, index) in attachments" :key="index" class="align-center mb-2">
                        <v-col cols="12" md="4">
                            <v-text-field v-model="attachment.title" label="Title"
                                placeholder="e.g. Complete Blood Count" variant="outlined" hide-details />
                        </v-col>

                        <v-col cols="12" md="3">
                            <v-select v-model="attachment.category" label="Category" variant="outlined" hide-details
                                :items="[
                                    { title: 'Laboratory', value: 'lab' },
                                    { title: 'Radiology', value: 'radiology' },
                                    { title: 'Image', value: 'image' },
                                    { title: 'Document', value: 'document' }
                                ]" />
                        </v-col>

                        <v-col cols="12" md="4">
                            <v-file-input v-model="attachment.file" label="File" variant="outlined"
                                prepend-icon="mdi-paperclip" hide-details accept=".pdf,.jpg,.jpeg,.png,.webp" />
                        </v-col>

                        <v-col cols="12" md="1" class="d-flex align-center justify-center">
                            <v-btn icon="mdi-delete-outline" color="error" variant="text" size="large"
                                @click="removeAttachment(index)" />
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
        </v-col>

        <v-col cols="12">
            <div class="d-flex justify-end ga-3">
                <v-btn variant="outlined">
                    Cancel
                </v-btn>
                <v-btn color="secondary" variant="tonal" prepend-icon="mdi-share-variant-outline"
                    :disabled="!isFormValid" @click="openReferral">
                    Refer Patient
                </v-btn>
                <v-btn color="primary" variant="flat" prepend-icon="mdi-content-save" :loading="saving"
                    :disabled="!isFormValid" @click="saveExamination">
                    Save Examination
                </v-btn>
            </div>
        </v-col>
    </v-row>

    <ReferralModal v-if="can('referrals.create')" v-model="referralDialog" :departments="departments" :doctors="doctors"
        :saving="referring" @submit="handleReferralSubmit" />

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" :timeout="3000">
        {{ snackbarMsg }}

        <template #actions>
            <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
        </template>
    </v-snackbar>
</template>