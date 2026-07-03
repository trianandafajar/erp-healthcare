<script setup lang="ts">
definePageMeta({
    layout: 'patient',
    middleware: ['auth', 'permission'],
    permissions: ['dashboard.view'],
})

useSeoMeta({
    title: 'Patient Dashboard',
    description: 'Patient dashboard overview',
})

const route = useRoute()
const slug = route.params.slug as string

const { profile, summary, visits, prescriptions, payments } = usePatientPortalMock()

const { data: visitsData } = await useFetch<{ visits: any[] }>('/api/patient/visits')
const { data: prescriptionsData } = await useFetch<{ prescriptions: any[] }>('/api/patient/prescriptions')

const realVisits = computed(() => visitsData.value?.visits ?? visits)
const realPrescriptions = computed(() => prescriptionsData.value?.prescriptions ?? prescriptions)

const realActivePrescriptionsCount = computed(() =>
    realPrescriptions.value.filter((p: any) => p.status === 'Active').length
)

const summaryCards = computed(() => [
    {
        title: 'Medical Record Number',
        value: profile.medicalRecordNumber,
        caption: 'Registered patient identity',
        color: 'primary',
        icon: 'mdi-card-account-details-outline',
        to: `/${slug}/patient/profile`
    },
    {
        title: 'Total Visits',
        value: String(realVisits.value.length),
        caption: 'All recorded visits',
        color: 'success',
        icon: 'mdi-clipboard-pulse-outline',
        to: `/${slug}/patient/visits`
    },
    {
        title: 'Active Prescriptions',
        value: realActivePrescriptionsCount.value.toString(),
        caption: 'Current medications to follow',
        color: 'warning',
        icon: 'mdi-pill',
        to: `/${slug}/patient/prescriptions`
    },
    {
        title: 'Unpaid Bills',
        // billing masih dummy
        value: summary.unpaidBills.toString(),
        caption: 'Pending billing items',
        color: 'error',
        icon: 'mdi-cash-clock',
        to: `/${slug}/patient/payments`
    }
])

const upcomingAppointment = computed(
    () => realVisits.value.find((item: any) => item.status === 'Scheduled') ?? null
)

const latestVisit = computed(() => realVisits.value.find((item: any) => item.status === 'Completed') ?? null)
const recentPrescription = computed(() => realPrescriptions.value[0] ?? null)
const recentMedication = computed(() => recentPrescription.value?.medications?.[0] ?? null)

// billing masih mock/dummy
const pendingPayments = computed(() => payments.filter((item: any) => item.status !== 'Paid'))

function formatDate(dateStr?: string) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2
    }).format(amount)
}

async function goTo(path: string) {
    await navigateTo(path)
}
</script>

<template>
    <div class="d-flex justify-space-between align-center mb-6 flex-wrap ga-3">
        <div>
            <h2 class="text-h3 mb-1">Patient Dashboard</h2>
            <p class="text-medium-emphasis mb-0">A quick overview of your health activity, appointments, and billing.
            </p>
        </div>
        <v-btn color="primary" prepend-icon="mdi-calendar-plus" :to="`/${slug}/patient/book-appointment`">
            Book Appointment
        </v-btn>
    </div>

    <v-row class="mb-1">
        <v-col v-for="card in summaryCards" :key="card.title" cols="12" sm="6" xl="3">
            <v-card elevation="0" rounded="lg" class="patient-dashboard-card cursor-pointer h-100"
                @click="goTo(card.to)">
                <v-card-text class="d-flex justify-space-between align-start">
                    <div>
                        <div class="text-caption text-medium-emphasis mb-2">{{ card.title }}</div>
                        <div class="text-h4 font-weight-bold">{{ card.value }}</div>
                        <div class="text-caption text-medium-emphasis mt-2">{{ card.caption }}</div>
                    </div>
                    <v-avatar :color="card.color" variant="tonal" size="44">
                        <v-icon :icon="card.icon" />
                    </v-avatar>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>

    <v-row>
        <v-col cols="12" lg="7">
            <UiTitleCard class-name="px-0 pb-0 rounded-md" title="Upcoming Appointment">
                <div v-if="upcomingAppointment" class="px-4 py-4 patient-dashboard-panel cursor-pointer"
                    @click="goTo(`/${slug}/patient/visits`)">
                    <v-card elevation="0" border rounded="lg" class="cursor-pointer">
                        <v-card-text>
                            <div class="d-flex justify-space-between align-start flex-wrap ga-3">
                                <div>
                                    <div class="text-h5">{{ upcomingAppointment.doctor }}</div>
                                    <div class="text-body-2 text-medium-emphasis">{{ upcomingAppointment.department }}
                                    </div>
                                </div>
                                <v-chip color="primary" variant="tonal">{{ upcomingAppointment.status }}</v-chip>
                            </div>
                            <v-divider class="my-4" />
                            <v-row>
                                <v-col cols="12" sm="6">
                                    <div class="text-caption text-medium-emphasis">Visit Date</div>
                                    <div class="text-body-1 font-weight-medium">{{ formatDate(upcomingAppointment.date)
                                    }}</div>
                                </v-col>
                                <v-col cols="12" sm="6">
                                    <div class="text-caption text-medium-emphasis">Complaint</div>
                                    <div class="text-body-1 font-weight-medium">{{ upcomingAppointment.complaint }}
                                    </div>
                                </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>
                </div>
                <div v-else class="px-4 py-8 text-center text-medium-emphasis">
                    No upcoming appointment yet.
                </div>
            </UiTitleCard>
        </v-col>

        <v-col cols="12" lg="5">
            <UiTitleCard class-name="px-0 pb-0 rounded-md" title="Recent Medical Activity">
                <div class="px-4 py-4 d-flex flex-column ga-4">
                    <v-card elevation="0" border rounded="lg" class="cursor-pointer"
                        @click="goTo(`/${slug}/patient/visits`)">
                        <v-card-text>
                            <div class="text-caption text-medium-emphasis">Latest Visit</div>
                            <div class="text-body-1 font-weight-medium mt-1">
                                {{ latestVisit?.department ?? '-' }} with {{ latestVisit?.doctor ?? '-' }}
                            </div>
                            <div class="text-caption text-medium-emphasis mt-1">{{ formatDate(latestVisit?.date) }}
                            </div>
                        </v-card-text>
                    </v-card>

                    <v-card elevation="0" border rounded="lg" class="cursor-pointer"
                        @click="goTo(`/${slug}/patient/prescriptions`)">
                        <v-card-text>
                            <div class="text-caption text-medium-emphasis">Recent Prescription</div>
                            <div class="text-body-1 font-weight-medium mt-1">
                                {{ recentMedication?.medication ?? '-' }}
                            </div>
                            <div class="text-caption text-medium-emphasis mt-1">
                                {{ recentMedication?.dosage ?? '-' }} | {{ recentMedication?.frequency ?? '-' }}
                            </div>
                        </v-card-text>
                    </v-card>

                    <v-card elevation="0" border rounded="lg" class="cursor-pointer"
                        @click="goTo(`/${slug}/patient/payments`)">
                        <v-card-text>
                            <div class="text-caption text-medium-emphasis">Outstanding Bills</div>
                            <div class="text-body-1 font-weight-medium mt-1">{{ pendingPayments.length }} invoice(s)
                            </div>
                            <div class="text-caption text-medium-emphasis mt-1">
                                {{ pendingPayments[0] ? formatCurrency(pendingPayments[0].amount) + ' first due item' :
                                    'All payments are completed.' }}
                            </div>
                        </v-card-text>
                    </v-card>
                </div>
            </UiTitleCard>
        </v-col>
    </v-row>
</template>

<style scoped>
.patient-dashboard-card,
.patient-dashboard-panel {
    transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.patient-dashboard-card:hover,
.patient-dashboard-panel:hover {
    transform: translateY(-2px);
}
</style>
