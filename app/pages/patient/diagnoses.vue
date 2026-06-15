<script setup lang="ts">
definePageMeta({
    layout: 'patient',
    middleware: 'auth'
})

useSeoMeta({
    title: 'Diagnosis History',
    description: 'Patient diagnosis history page',
})

const { diagnoses } = usePatientPortalMock()
const search = ref('')
const detailDialog = ref(false)
const selectedDiagnosis = ref<(typeof diagnoses)[number] | null>(null)

const filteredDiagnoses = computed(() =>
    diagnoses.filter((item) => {
        const keyword = search.value.toLowerCase()
        return (
            item.diagnosis.toLowerCase().includes(keyword) ||
            item.doctor.toLowerCase().includes(keyword) ||
            item.code.toLowerCase().includes(keyword) ||
            item.department.toLowerCase().includes(keyword)
        )
    })
)

function openDetail(item: (typeof diagnoses)[number]) {
    selectedDiagnosis.value = item
    detailDialog.value = true
}

function severityColor(severity: string) {
    return ({
        Low: 'success',
        Moderate: 'warning',
        High: 'error'
    } as Record<string, string>)[severity] ?? 'secondary'
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
}
</script>

<template>
    <div class="d-flex justify-space-between align-center mb-6 flex-wrap ga-3">
        <div>
            <h2 class="text-h3 mb-1">Diagnosis History</h2>
            <p class="text-medium-emphasis mb-0">Review diagnosis records and open the full clinical details when needed.</p>
        </div>
    </div>

    <UiTitleCard class-name="px-0 pb-0 rounded-md" title="Diagnosis Records">
        <div class="px-4 py-3">
            <v-text-field v-model="search" placeholder="Search diagnosis, doctor, code, or department"
                prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable
                style="max-width: 380px" />
        </div>

        <v-table class="text-no-wrap">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Diagnosis</th>
                    <th>Code</th>
                    <th>Department</th>
                    <th>Doctor</th>
                    <th>Severity</th>
                    <th class="text-right">Action</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in filteredDiagnoses" :key="item.id">
                    <td>{{ formatDate(item.date) }}</td>
                    <td class="text-wrap">{{ item.diagnosis }}</td>
                    <td>{{ item.code }}</td>
                    <td>{{ item.department }}</td>
                    <td>{{ item.doctor }}</td>
                    <td>
                        <v-chip size="small" :color="severityColor(item.severity)" variant="tonal">
                            {{ item.severity }}
                        </v-chip>
                    </td>
                    <td class="text-right">
                        <v-btn size="small" variant="text" color="primary" prepend-icon="mdi-eye-outline"
                            @click="openDetail(item)">
                            View Detail
                        </v-btn>
                    </td>
                </tr>
                <tr v-if="filteredDiagnoses.length === 0">
                    <td colspan="7" class="text-center py-6 text-medium-emphasis">No diagnosis record found.</td>
                </tr>
            </tbody>
        </v-table>
    </UiTitleCard>

    <v-dialog v-model="detailDialog" max-width="900">
        <v-card v-if="selectedDiagnosis" rounded="lg">
            <v-card-item>
                <div class="d-flex justify-space-between align-start flex-wrap ga-3">
                    <div>
                        <v-card-title class="px-0">{{ selectedDiagnosis.diagnosis }}</v-card-title>
                        <v-card-subtitle class="px-0 mt-1">
                            {{ selectedDiagnosis.code }} | {{ selectedDiagnosis.department }} | {{ selectedDiagnosis.doctor }}
                        </v-card-subtitle>
                    </div>
                    <div class="d-flex flex-wrap ga-2">
                        <v-chip color="primary" variant="tonal">{{ formatDate(selectedDiagnosis.date) }}</v-chip>
                        <v-chip :color="severityColor(selectedDiagnosis.severity)" variant="tonal">
                            {{ selectedDiagnosis.severity }} severity
                        </v-chip>
                    </div>
                </div>
            </v-card-item>

            <v-card-text>
                <v-row>
                    <v-col cols="12">
                        <div class="text-caption text-medium-emphasis mb-1">Clinical Summary</div>
                        <div class="text-body-2">{{ selectedDiagnosis.notes }}</div>
                    </v-col>
                    <v-col cols="12" md="6">
                        <div class="text-caption text-medium-emphasis mb-2">Reported Symptoms</div>
                        <v-chip v-for="symptom in selectedDiagnosis.symptoms" :key="symptom" size="small"
                            class="mr-2 mb-2" color="primary" variant="outlined">
                            {{ symptom }}
                        </v-chip>
                    </v-col>
                    <v-col cols="12" md="6">
                        <div class="text-caption text-medium-emphasis mb-2">Clinical Findings</div>
                        <v-list density="compact" class="py-0 bg-transparent">
                            <v-list-item v-for="finding in selectedDiagnosis.findings" :key="finding" class="px-0">
                                <template #prepend>
                                    <v-icon icon="mdi-check-circle-outline" size="18" color="success" class="mr-2" />
                                </template>
                                <v-list-item-title class="text-body-2 text-wrap">{{ finding }}</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-col>
                    <v-col cols="12">
                        <div class="text-caption text-medium-emphasis mb-2">Care Plan</div>
                        <v-list density="compact" class="py-0 bg-transparent">
                            <v-list-item v-for="step in selectedDiagnosis.carePlan" :key="step" class="px-0">
                                <template #prepend>
                                    <v-icon icon="mdi-chevron-right" size="18" color="primary" class="mr-2" />
                                </template>
                                <v-list-item-title class="text-body-2 text-wrap">{{ step }}</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-col>
                    <v-col cols="12">
                        <div class="text-caption text-medium-emphasis mb-1">Follow-up Guidance</div>
                        <v-alert color="info" variant="tonal" rounded="lg">
                            {{ selectedDiagnosis.followUp }}
                        </v-alert>
                    </v-col>
                </v-row>
            </v-card-text>

            <v-card-actions class="px-6 pb-4">
                <v-spacer />
                <v-btn variant="text" @click="detailDialog = false">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
