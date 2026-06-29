<script setup lang="ts">
import {
    ClockCircleOutlined,
    CheckCircleOutlined,
    MedicineBoxOutlined,
    TeamOutlined
} from '@ant-design/icons-vue'

definePageMeta({
    layout: 'doctor',
    middleware: ['auth', 'permission'],
    permissions: ['dashboard.view'],
})

useSeoMeta({
    title: 'Doctor Dashboard',
    ogTitle: 'My Amazing Site',
    description: 'This is my amazing site, let me tell you all about it.',
    ogDescription: 'This is my amazing site, let me tell you all about it.',
    ogImage: 'https://example.com/image.png',
    twitterCard: 'summary_large_image',
})

const { data } = await useFetch<any>(
    '/api/doctor/dashboard'
)

const summary = computed(() =>
    data.value?.summary ?? {}
)

const patientStatus = computed(() =>
    data.value?.patient_status ?? {}
)

const patientTrend = computed(() =>
    data.value?.patient_trend ?? []
)

const peakHours = computed(() =>
    data.value?.peak_hours ?? []
)

const examinations = computed(() =>
    data.value?.recent_examinations ?? []
)

const prescriptions = computed(() =>
    data.value?.recent_prescriptions ?? []
)

const statCards = computed(() => [
    {
        name: 'Total Examinations',
        earn: String(summary.value.total_examinations ?? 0),
        percent: null,
        color: 'primary',
        icon: TeamOutlined,
        text: 'All examinations today',
        to: '/doctor/examination'
    },
    {
        name: 'Waiting Patients',
        earn: String(summary.value.waiting_patients ?? 0),
        percent: null,
        color: 'warning',
        icon: ClockCircleOutlined,
        text: 'Patients in queue',
        to: '/doctor/patients/today'
    },
    {
        name: 'Done Today',
        earn: String(summary.value.done_today ?? 0),
        percent: null,
        color: 'success',
        icon: CheckCircleOutlined,
        text: 'Completed examinations',
        to: '/doctor/medical-records'
    },
    {
        name: 'Prescriptions',
        earn: String(summary.value.total_prescriptions ?? 0),
        percent: null,
        color: 'info',
        icon: MedicineBoxOutlined,
        text: 'Total prescriptions issued',
        to: '/doctor/dashboard'
    }
])

const examStatusSeries = computed(() => [
    patientStatus.value.waiting ?? 0,
    patientStatus.value.in_progress ?? 0,
    patientStatus.value.done ?? 0
])

const examStatusOptions = {
    chart: {
        type: 'donut',
        fontFamily: 'inherit'
    },
    labels: [
        'Waiting',
        'In Progress',
        'Done'
    ],
    colors: [
        '#faad14',
        '#1677ff',
        '#52c41a'
    ],
    legend: {
        position: 'bottom'
    },
    dataLabels: {
        enabled: true
    }
}

const patientTrendSeries = computed(() => [
    {
        name: 'Patients',
        data: patientTrend.value.map(
            (item: any) => item.count
        )
    }
])

const patientTrendOptions = computed(() => ({
    chart: {
        type: 'line',
        toolbar: {
            show: false
        },
        fontFamily: 'inherit'
    },
    stroke: {
        curve: 'smooth',
        width: 2
    },
    colors: ['#1677ff'],
    dataLabels: {
        enabled: false
    },
    xaxis: {
        categories: patientTrend.value.map(
            (item: any) =>
                new Date(item.date)
                    .toLocaleDateString(
                        'id-ID',
                        {
                            day: '2-digit',
                            month: 'short'
                        }
                    )
        )
    },
    grid: {
        strokeDashArray: 4
    }
}))

const peakHourSeries = computed(() => [
    {
        name: 'Patients',
        data: peakHours.value.map(
            (item: any) => item.count
        )
    }
])

const peakHourOptions = computed(() => ({
    chart: {
        type: 'area',
        toolbar: {
            show: false
        },
        fontFamily: 'inherit'
    },
    stroke: {
        curve: 'smooth',
        width: 2
    },
    colors: ['#52c41a'],
    dataLabels: {
        enabled: false
    },
    xaxis: {
        categories: peakHours.value.map(
            (item: any) => item.hour
        )
    },
    grid: {
        strokeDashArray: 4
    }
}))

const topMedicines = computed(() =>
    data.value?.top_medicines ?? []
)

const topMedicineSeries = computed(() => [{
    name: 'Prescriptions',
    data: topMedicines.value.map(
        (item: any) => item.count
    )
}])

const topMedicineOptions = computed(() => ({
    chart: {
        type: 'bar',
        toolbar: {
            show: false
        },
        fontFamily: 'inherit'
    },
    plotOptions: {
        bar: {
            borderRadius: 6,
            horizontal: true
        }
    },
    colors: ['#1677ff'],
    dataLabels: {
        enabled: false
    },
    xaxis: {
        categories: topMedicines.value.map(
            (item: any) => item.name
        )
    },
    grid: {
        strokeDashArray: 4
    }
}))

function formatTime(time?: string) {
    if (!time) return '-'
    return time.slice(0, 5)
}
</script>
<template>
    <div class="d-flex flex-column ga-4">
        <v-card elevation="0">
            <v-card-text>
                <div class="text-h5 font-weight-bold">Doctor Dashboard</div>
                <div class="text-caption text-medium-emphasis">Overview daily clinic activity</div>
            </v-card-text>
        </v-card>

        <v-row class="my-0">
            <v-col cols="6" sm="4" md="" v-for="(card, i) in statCards" :key="i" :style="{ flex: '1 1 0' }"
                class="flex-grow-1">
                <v-card :to="card.to" elevation="0">
                    <v-card-text>
                        <div class="d-flex align-items-center justify-space-between">
                            <div>
                                <h6 class="text-h6 text-lightText mb-1">{{ card.name }}</h6>
                                <h4 class="text-h4 d-flex align-center mb-0">
                                    {{ card.earn }}
                                    <v-chip v-if="card.percent" :color="card.color"
                                        :border="`${card.color} solid thin opacity-50`" class="ml-2" size="small" label>
                                        <template v-slot:prepend>
                                            <component :is="card.icon" :style="{ fontSize: '12px' }"
                                                :class="'mr-1 text-' + card.color" />
                                        </template>
                                        {{ card.percent }}
                                    </v-chip>
                                </h4>
                                <span class="text-lightText text-caption pt-5 d-block">
                                    {{ card.text }}
                                </span>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <v-row class="my-0">
            <v-col cols="12" md="4">
                <v-card elevation="0" class="h-100">
                    <v-card-text>
                        <div class="text-subtitle-1 font-weight-bold mb-3">Patient Status</div>
                        <ClientOnly>
                            <apexchart type="donut" height="260" :options="examStatusOptions"
                                :series="examStatusSeries" />
                        </ClientOnly>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="8">
                <v-card elevation="0" class="h-100">
                    <v-card-text>
                        <div class="text-subtitle-1 font-weight-bold mb-3">Patient Trend (7 Days)</div>
                        <ClientOnly>
                            <apexchart type="line" height="260" :options="patientTrendOptions"
                                :series="patientTrendSeries" />
                        </ClientOnly>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <v-row class="my-0">
            <v-col cols="12" md="6">
                <v-card elevation="0">
                    <v-card-text>
                        <div class="text-subtitle-1 font-weight-bold mb-3"> Top Medicines</div>
                        <ClientOnly>
                            <apexchart type="bar" height="240" :options="topMedicineOptions"
                                :series="topMedicineSeries" />
                        </ClientOnly>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="6">
                <v-card elevation="0">
                    <v-card-text>
                        <div class="text-subtitle-1 font-weight-bold mb-3">Peak Hour Activity</div>
                        <ClientOnly>
                            <apexchart type="area" height="240" :options="peakHourOptions" :series="peakHourSeries" />
                        </ClientOnly>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <v-row class="my-0 align-stretch">
            <v-col cols="12" md="6" class="d-flex">
                <v-card elevation="0" class="flex-grow-1 dashboard-card">
                    <v-card-text class="d-flex flex-column h-100">
                        <div class="d-flex justify-space-between align-center mb-3">
                            <div class="text-subtitle-1 font-weight-bold">
                                Today's Examinations
                            </div>

                            <v-btn size="small" color="primary" variant="tonal" to="/doctor/examination">
                                View All
                            </v-btn>
                        </div>

                        <div class="table-wrapper">
                            <v-table density="compact" fixed-header>
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Time</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <tr v-for="item in examinations" :key="item.id">
                                        <td>
                                            {{ item.patients?.full_name }}
                                        </td>

                                        <td>
                                            {{ formatTime(item.appointment_time) }}
                                        </td>

                                        <td>
                                            <v-chip size="small" :color="item.status === 'done'
                                                ? 'success'
                                                : item.status === 'in_progress'
                                                    ? 'primary'
                                                    : 'warning'
                                                ">
                                                {{ item.status }}
                                            </v-chip>
                                        </td>
                                    </tr>

                                    <tr v-if="!examinations.length">
                                        <td colspan="3" class="text-center py-8 text-medium-emphasis">
                                            No examinations found
                                        </td>
                                    </tr>
                                </tbody>
                            </v-table>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="6" class="d-flex">
                <v-card elevation="0" class="flex-grow-1 dashboard-card">
                    <v-card-text class="d-flex flex-column h-100">
                        <div class="d-flex justify-space-between align-center mb-3">
                            <div class="text-subtitle-1 font-weight-bold">
                                Recent Prescriptions
                            </div>
                        </div>

                        <div class="table-wrapper">
                            <v-table density="compact" fixed-header>
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Medicine</th>
                                        <th>Dosage</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <tr v-for="item in prescriptions" :key="item.id">
                                        <td>
                                            {{
                                                item.medical_records?.patients?.full_name
                                            }}
                                        </td>

                                        <td>
                                            {{ item.medication_name }}
                                        </td>

                                        <td>
                                            <v-chip size="small" color="primary" variant="tonal">
                                                {{ item.dosage }} mg
                                            </v-chip>
                                        </td>
                                    </tr>

                                    <tr v-if="!prescriptions.length">
                                        <td colspan="3" class="text-center py-8 text-medium-emphasis">
                                            No prescriptions found
                                        </td>
                                    </tr>
                                </tbody>
                            </v-table>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

    </div>
</template>