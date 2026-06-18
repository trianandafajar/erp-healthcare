<script setup lang="ts">
definePageMeta({
    layout: 'default',
    middleware: ['auth', 'permission'],
    permissions: ['report.view'],
})

// ── Dummy data — replace with real API calls once report sources are defined ─
const summaryCards = [
    { label: 'Total Visits (This Month)', value: '482', icon: 'mdi-calendar-check', color: 'primary', trend: '+12.4%', trendUp: true },
    { label: 'New Patients', value: '96', icon: 'mdi-account-plus-outline', color: 'success', trend: '+8.1%', trendUp: true },
    { label: 'Referrals Made', value: '34', icon: 'mdi-share-variant-outline', color: 'secondary', trend: '-3.2%', trendUp: false },
    { label: 'Prescriptions Issued', value: '610', icon: 'mdi-pill', color: 'warning', trend: '+5.6%', trendUp: true },
]

const visitsByMonth = [42, 58, 51, 67, 74, 69, 82, 78, 91, 85, 96, 88]
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const visitsChartOptions = computed(() => ({
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
    colors: ['#1677ff'],
    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
    dataLabels: { enabled: false },
    xaxis: { categories: months, axisBorder: { show: false } },
    grid: { strokeDashArray: 4 },
    tooltip: { theme: 'light' },
}))

const visitsChartSeries = [{ name: 'Visits', data: visitsByMonth }]

const departmentLoad = [
    { name: 'Poli Umum', value: 38 },
    { name: 'Poli Anak', value: 22 },
    { name: 'Poli Gigi', value: 14 },
    { name: 'Poli Jantung', value: 18 },
    { name: 'Poli Mata', value: 8 },
]

const departmentChartOptions = computed(() => ({
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels: departmentLoad.map(d => d.name),
    colors: ['#1677ff', '#52c41a', '#722ed1', '#13c2c2', '#faad14'],
    legend: { position: 'bottom' },
    dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(0)}%` },
    tooltip: { theme: 'light' },
}))

const departmentChartSeries = departmentLoad.map(d => d.value)

const topDiagnoses = [
    { rank: 1, name: 'ISPA (Infeksi Saluran Pernapasan Atas)', count: 84 },
    { rank: 2, name: 'Hipertensi', count: 61 },
    { rank: 3, name: 'Diabetes Mellitus Tipe 2', count: 47 },
    { rank: 4, name: 'Gastritis', count: 39 },
    { rank: 5, name: 'Dermatitis', count: 28 },
]

const reportTableHeaders = ['Report', 'Period', 'Generated', 'Format']
const availableReports = [
    { name: 'Monthly Visit Summary', period: 'June 2026', generated: '17 Jun 2026', format: 'PDF' },
    { name: 'Doctor Performance Report', period: 'Q2 2026', generated: '15 Jun 2026', format: 'XLSX' },
    { name: 'Department Utilization', period: 'June 2026', generated: '14 Jun 2026', format: 'PDF' },
    { name: 'Referral Activity Log', period: 'June 2026', generated: '10 Jun 2026', format: 'XLSX' },
]
</script>

<template>
    <v-row>
        <v-col cols="12">
            <v-card-item class="pb-2 px-0 pt-0">
                <div class="d-flex justify-space-between align-center flex-wrap ga-3">
                    <div>
                        <v-card-title class="text-h3">Reports</v-card-title>
                        <v-card-subtitle class="mt-1">Overview of clinic activity — sample data, pending real report
                            sources</v-card-subtitle>
                    </div>
                </div>
            </v-card-item>
        </v-col>

        <!-- Summary cards -->
        <v-col cols="12" sm="6" md="3" v-for="(card, i) in summaryCards" :key="i">
            <v-card elevation="0">
                <v-card-text>
                    <div class="d-flex justify-space-between align-start">
                        <div>
                            <div class="text-caption text-medium-emphasis mb-1">{{ card.label }}</div>
                            <div class="text-h4 font-weight-bold">{{ card.value }}</div>
                            <v-chip :color="card.trendUp ? 'success' : 'error'" size="x-small" variant="tonal"
                                class="mt-2">
                                <v-icon :icon="card.trendUp ? 'mdi-trending-up' : 'mdi-trending-down'" size="12"
                                    class="mr-1" />
                                {{ card.trend }}
                            </v-chip>
                        </div>
                        <v-avatar :color="card.color" variant="tonal" size="44">
                            <v-icon :icon="card.icon" size="22" />
                        </v-avatar>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>

        <!-- Visits chart -->
        <v-col cols="12" md="7">
            <v-card elevation="0" class="h-100">
                <v-card-item>
                    <v-card-title class="text-h5">Monthly Visits</v-card-title>
                    <v-card-subtitle>Sample data — total visits per month</v-card-subtitle>
                </v-card-item>
                <v-card-text>
                    <ClientOnly>
                        <apexchart type="bar" height="300" :options="visitsChartOptions" :series="visitsChartSeries" />
                    </ClientOnly>
                </v-card-text>
            </v-card>
        </v-col>

        <!-- Department load -->
        <v-col cols="12" md="5">
            <v-card elevation="0" class="h-100">
                <v-card-item>
                    <v-card-title class="text-h5">Department Load</v-card-title>
                    <v-card-subtitle>Sample data — share of visits per department</v-card-subtitle>
                </v-card-item>
                <v-card-text>
                    <ClientOnly>
                        <apexchart type="donut" height="300" :options="departmentChartOptions"
                            :series="departmentChartSeries" />
                    </ClientOnly>
                </v-card-text>
            </v-card>
        </v-col>

        <!-- Top diagnoses -->
        <v-col cols="12" md="5">
            <v-card elevation="0" class="h-100">
                <v-card-item>
                    <v-card-title class="text-h5">Top Diagnoses</v-card-title>
                    <v-card-subtitle>Sample data — most frequent diagnoses this month</v-card-subtitle>
                </v-card-item>
                <v-divider />
                <v-list density="comfortable">
                    <v-list-item v-for="d in topDiagnoses" :key="d.rank">
                        <template #prepend>
                            <v-avatar size="28" color="primary" variant="tonal">
                                <span class="text-caption font-weight-bold">{{ d.rank }}</span>
                            </v-avatar>
                        </template>
                        <v-list-item-title class="text-body-2">{{ d.name }}</v-list-item-title>
                        <template #append>
                            <span class="text-body-2 font-weight-medium">{{ d.count }}</span>
                        </template>
                    </v-list-item>
                </v-list>
            </v-card>
        </v-col>

        <!-- Available / generated reports -->
        <v-col cols="12" md="7">
            <v-card elevation="0" class="h-100">
                <v-card-item>
                    <div class="d-flex justify-space-between align-center">
                        <div>
                            <v-card-title class="text-h5">Generated Reports</v-card-title>
                            <v-card-subtitle>Sample list — export functionality not yet implemented</v-card-subtitle>
                        </div>
                        <v-btn color="primary" variant="flat" size="small" prepend-icon="mdi-plus" disabled>
                            New Report
                        </v-btn>
                    </div>
                </v-card-item>
                <v-divider />
                <v-table density="comfortable">
                    <thead class="bg-containerBg">
                        <tr>
                            <th v-for="h in reportTableHeaders" :key="h"
                                class="text-left text-caption font-weight-bold text-uppercase">
                                {{ h }}
                            </th>
                            <th class="text-right text-caption font-weight-bold text-uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(r, i) in availableReports" :key="i">
                            <td class="py-3 text-body-2 font-weight-medium">{{ r.name }}</td>
                            <td class="py-3 text-body-2 text-medium-emphasis">{{ r.period }}</td>
                            <td class="py-3 text-body-2 text-medium-emphasis">{{ r.generated }}</td>
                            <td class="py-3">
                                <v-chip size="small" variant="tonal" color="secondary" label>{{ r.format }}</v-chip>
                            </td>
                            <td class="py-3 text-right">
                                <v-btn icon="mdi-download-outline" variant="text" size="small" disabled />
                            </td>
                        </tr>
                    </tbody>
                </v-table>
            </v-card>
        </v-col>
    </v-row>
</template>