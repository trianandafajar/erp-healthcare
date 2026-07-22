<script setup lang="ts">

interface ReferralMade {
    id: string
    reason: string
    notes: string | null
    status: string
    created_at: string
    patient_name: string
    medical_record_number: string
    department_name: string
    department_code: string | null
    to_doctor_name: string | null
    appointment_date: string | null
    appointment_status: string | null
}

interface ReferralReceived {
    id: string
    reason: string
    notes: string | null
    status: string
    created_at: string
    patient_name: string
    medical_record_number: string
    from_doctor_name: string
    department_name: string
    appointment_date: string | null
    appointment_status: string | null
}

const tab = ref('received')

const { data: madeData, pending: madePending } = await useFetch<{ referrals: ReferralMade[] }>('/api/doctor/referrals/made')
const { data: receivedData, pending: receivedPending } = await useFetch<{ referrals: ReferralReceived[] }>('/api/doctor/referrals/received')

const referralsMade = computed(() => madeData.value?.referrals ?? [])
const referralsReceived = computed(() => receivedData.value?.referrals ?? [])

const statusColors: Record<string, string> = {
    pending: 'warning',
    accepted: 'info',
    completed: 'success',
    rejected: 'error',
}

function formatDate(dateStr?: string | null) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}
</script>

<template>
    <v-row>
        <v-col cols="12">
            <v-card-item class="pb-2 px-0 pt-0">
                <v-card-title class="text-h3">Referrals</v-card-title>
                <v-card-subtitle class="mt-1">Track patients you've referred and referrals sent to you</v-card-subtitle>
            </v-card-item>
        </v-col>

        <v-col cols="12">
            <v-card>
                <v-tabs v-model="tab" color="primary">
                    <v-tab value="received">
                        Referrals Received
                        <v-chip v-if="referralsReceived.length" size="x-small" color="primary" variant="flat"
                            class="ml-2">
                            {{ referralsReceived.length }}
                        </v-chip>
                    </v-tab>
                    <v-tab value="made">
                        Referrals Made
                        <v-chip v-if="referralsMade.length" size="x-small" color="secondary" variant="flat"
                            class="ml-2">
                            {{ referralsMade.length }}
                        </v-chip>
                    </v-tab>
                </v-tabs>

                <v-divider />

                <v-window v-model="tab">
                    <!-- received -->
                    <v-window-item value="received">
                        <v-table hover density="comfortable">
                            <thead class="bg-containerBg">
                                <tr>
                                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Patient</th>
                                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">From Doctor</th>
                                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Reason</th>
                                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Status</th>
                                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="receivedPending">
                                    <td colspan="5" class="text-center py-8">
                                        <v-progress-circular indeterminate color="primary" />
                                    </td>
                                </tr>
                                <tr v-else-if="referralsReceived.length === 0">
                                    <td colspan="5" class="text-center py-8 text-medium-emphasis">
                                        <v-icon icon="mdi-share-variant-outline" size="32"
                                            class="mb-2 d-block mx-auto" />
                                        No referrals received
                                    </td>
                                </tr>
                                <tr v-else v-for="r in referralsReceived" :key="r.id">
                                    <td class="py-3">
                                        <div class="text-body-2 font-weight-medium">{{ r.patient_name }}</div>
                                        <div class="text-caption text-medium-emphasis">{{ r.medical_record_number }}
                                        </div>
                                    </td>
                                    <td class="py-3 text-body-2 text-medium-emphasis">
                                        {{ r.from_doctor_name }}
                                    </td>
                                    <td class="py-3 text-body-2 text-medium-emphasis" style="max-width: 280px;">
                                        {{ r.reason }}
                                    </td>
                                    <td class="py-3">
                                        <v-chip :color="statusColors[r.status] ?? 'secondary'" variant="tonal"
                                            size="small" class="text-capitalize">
                                            {{ r.status }}
                                        </v-chip>
                                    </td>
                                    <td class="py-3 text-body-2 text-medium-emphasis">
                                        {{ formatDate(r.created_at) }}
                                    </td>
                                </tr>
                            </tbody>
                        </v-table>
                    </v-window-item>

                    <!-- made -->
                    <v-window-item value="made">
                        <v-table hover density="comfortable">
                            <thead class="bg-containerBg">
                                <tr>
                                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Patient</th>
                                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">To Department
                                    </th>
                                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">To Doctor</th>
                                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Reason</th>
                                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Status</th>
                                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="madePending">
                                    <td colspan="6" class="text-center py-8">
                                        <v-progress-circular indeterminate color="primary" />
                                    </td>
                                </tr>
                                <tr v-else-if="referralsMade.length === 0">
                                    <td colspan="6" class="text-center py-8 text-medium-emphasis">
                                        <v-icon icon="mdi-share-variant-outline" size="32"
                                            class="mb-2 d-block mx-auto" />
                                        No referrals made yet
                                    </td>
                                </tr>
                                <tr v-else v-for="r in referralsMade" :key="r.id">
                                    <td class="py-3">
                                        <div class="text-body-2 font-weight-medium">{{ r.patient_name }}</div>
                                        <div class="text-caption text-medium-emphasis">{{ r.medical_record_number }}
                                        </div>
                                    </td>
                                    <td class="py-3">
                                        <v-chip size="small" variant="tonal" color="secondary" label>
                                            {{ r.department_name }}
                                        </v-chip>
                                    </td>
                                    <td class="py-3 text-body-2 text-medium-emphasis">
                                        {{ r.to_doctor_name ?? 'Department queue' }}
                                    </td>
                                    <td class="py-3 text-body-2 text-medium-emphasis" style="max-width: 240px;">
                                        {{ r.reason }}
                                    </td>
                                    <td class="py-3">
                                        <v-chip :color="statusColors[r.status] ?? 'secondary'" variant="tonal"
                                            size="small" class="text-capitalize">
                                            {{ r.status }}
                                        </v-chip>
                                    </td>
                                    <td class="py-3 text-body-2 text-medium-emphasis">
                                        {{ formatDate(r.created_at) }}
                                    </td>
                                </tr>
                            </tbody>
                        </v-table>
                    </v-window-item>
                </v-window>
            </v-card>
        </v-col>
    </v-row>
</template>