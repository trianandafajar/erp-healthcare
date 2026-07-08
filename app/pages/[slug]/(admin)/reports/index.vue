<script setup lang="ts">
definePageMeta({
    layout: 'default',
    middleware: ['auth', 'permission', 'plan'],
    permissions: ['report.view'],
    requiredFeature: 'reports',
})

const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth()

const filterMode = ref<'month' | 'range'>('month')
const filterYear = ref(currentYear)
const filterMonth = ref(currentMonth)
const filterDateFrom = ref('')
const filterDateTo = ref('')

const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)
const monthOptions = [
    { label: 'January', value: 0 }, { label: 'February', value: 1 },
    { label: 'March', value: 2 }, { label: 'April', value: 3 },
    { label: 'May', value: 4 }, { label: 'June', value: 5 },
    { label: 'July', value: 6 }, { label: 'August', value: 7 },
    { label: 'September', value: 8 }, { label: 'October', value: 9 },
    { label: 'November', value: 10 }, { label: 'December', value: 11 },
]

const { data: statsData, pending: statsPending } = await useFetch('/api/dashboard/stats')
const { data: monthlyData, pending: monthlyPending, refresh: refreshMonthly } = await useFetch('/api/dashboard/monthly-appointments', {
    query: { year: filterYear },
})
const { data: appointmentsData, pending: appointmentsPending } = await useFetch('/api/appointments')
const { data: medicalRecordsData, pending: recordsPending } = await useFetch('/api/doctor/medical-records')
const { data: departmentsData, pending: deptPending } = await useFetch('/api/departments')
const { data: referralsData, pending: referralsPending } = await useFetch('/api/doctor/referrals/made')

const isLoading = computed(() =>
    statsPending.value || monthlyPending.value || appointmentsPending.value ||
    recordsPending.value || deptPending.value || referralsPending.value
)

const activeRange = computed<{ from: Date; to: Date }>(() => {
    if (filterMode.value === 'range' && filterDateFrom.value && filterDateTo.value) {
        return {
            from: new Date(filterDateFrom.value),
            to: new Date(filterDateTo.value + 'T23:59:59'),
        }
    }
    const from = new Date(filterYear.value, filterMonth.value, 1)
    const to = new Date(filterYear.value, filterMonth.value + 1, 0, 23, 59, 59)
    return { from, to }
})

const activePeriodLabel = computed(() => {
    if (filterMode.value === 'range' && filterDateFrom.value && filterDateTo.value) {
        return `${filterDateFrom.value} – ${filterDateTo.value}`
    }
    return new Date(filterYear.value, filterMonth.value, 1)
        .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

function inRange(dateStr: string) {
    if (!dateStr) return false
    const d = new Date(dateStr)
    return d >= activeRange.value.from && d <= activeRange.value.to
}

function resetFilters() {
    filterMode.value = 'month'
    filterYear.value = currentYear
    filterMonth.value = currentMonth
    filterDateFrom.value = ''
    filterDateTo.value = ''
}

watch(filterYear, () => refreshMonthly())

const summaryCards = computed(() => {
    const allAppointments = appointmentsData.value?.appointments ?? []
    const allReferrals = referralsData.value?.referrals ?? []
    const allRecords = medicalRecordsData.value?.medical_records ?? []

    const visitsInRange = allAppointments.filter((a: any) => inRange(a.appointment_date))
    const newPatientIds = new Set(visitsInRange.map((a: any) => a.patient?.id).filter(Boolean))
    const referralsInRange = allReferrals.filter((r: any) => inRange(r.created_at))
    const recordsInRange = allRecords.filter((r: any) => inRange(r.created_at))

    const rangeMs = activeRange.value.to.getTime() - activeRange.value.from.getTime()
    const prevTo = new Date(activeRange.value.from.getTime() - 1)
    const prevFrom = new Date(prevTo.getTime() - rangeMs)

    const inPrev = (dateStr: string) => {
        const d = new Date(dateStr)
        return d >= prevFrom && d <= prevTo
    }

    const visitsPrev = allAppointments.filter((a: any) => inPrev(a.appointment_date)).length
    const referralsPrev = allReferrals.filter((r: any) => inPrev(r.created_at)).length

    const calcTrend = (current: number, prev: number) => {
        if (prev === 0) return { text: '+100%', up: true }
        const pct = ((current - prev) / prev) * 100
        return { text: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, up: pct >= 0 }
    }

    const visitsTrend = calcTrend(visitsInRange.length, visitsPrev)
    const referralsTrend = calcTrend(referralsInRange.length, referralsPrev)

    return [
        {
            label: 'Total Visits',
            value: visitsInRange.length.toString(),
            icon: 'mdi-calendar-check', color: 'primary',
            trend: visitsTrend.text, trendUp: visitsTrend.up,
        },
        {
            label: 'New Patients',
            value: newPatientIds.size.toString(),
            icon: 'mdi-account-plus-outline', color: 'success',
            trend: '—', trendUp: true,
        },
        {
            label: 'Referrals Made',
            value: referralsInRange.length.toString(),
            icon: 'mdi-share-variant-outline', color: 'secondary',
            trend: referralsTrend.text, trendUp: referralsTrend.up,
        },
        {
            label: 'Medical Records',
            value: recordsInRange.length.toString(),
            icon: 'mdi-file-document-outline', color: 'warning',
            trend: '—', trendUp: true,
        },
    ]
})

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const visitsByMonth = computed(() => (monthlyData.value && (monthlyData.value as any).series) ?? Array(12).fill(0))

const visitsChartOptions = computed(() => ({
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
    colors: ['#1677ff'],
    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
    dataLabels: { enabled: false },
    xaxis: { categories: months, axisBorder: { show: false } },
    grid: { strokeDashArray: 4 },
    tooltip: { theme: 'light' },
}))

const visitsChartSeries = computed(() => [{ name: 'Visits', data: visitsByMonth.value }])

const computedDeptLoad = computed(() => {
    const allAppointments = appointmentsData.value?.appointments ?? []
    const filtered = allAppointments.filter((a: any) => inRange(a.appointment_date))
    const deptCount: Record<string, { name: string; count: number }> = {}
    for (const appt of filtered) {
        const deptName = appt.department?.name ?? appt.doctor?.department?.[0]?.name
        if (!deptName) continue
        if (!deptCount[deptName]) deptCount[deptName] = { name: deptName, count: 0 }
        deptCount[deptName].count++
    }
    return Object.values(deptCount).sort((a, b) => b.count - a.count).slice(0, 7)
})

const departmentChartOptions = computed(() => ({
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels: computedDeptLoad.value.map((d: any) => d.name),
    colors: ['#1677ff', '#52c41a', '#722ed1', '#13c2c2', '#faad14', '#ff4d4f', '#fa8c16'],
    legend: { position: 'bottom' },
    dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(0)}%` },
    tooltip: { theme: 'light' },
    noData: { text: 'No data available' },
}))

const departmentChartSeries = computed(() => computedDeptLoad.value.map((d: any) => d.count))

const topDiagnoses = computed(() => {
    const records = (medicalRecordsData.value?.medical_records ?? [])
        .filter((r: any) => inRange(r.created_at))
    const diagCount: Record<string, number> = {}
    for (const rec of records) {
        const key = rec.diagnosis?.trim()
        if (!key) continue
        diagCount[key] = (diagCount[key] ?? 0) + 1
    }
    return Object.entries(diagCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count], i) => ({ rank: i + 1, name, count }))
})

const reportTableHeaders = ['Report', 'Period', 'Generated', 'Format']
const todayLabel = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

const availableReports = computed(() => {
    const totalVisits = (appointmentsData.value?.appointments ?? [])
        .filter((a: any) => inRange(a.appointment_date)).length
    const totalReferrals = (referralsData.value?.referrals ?? [])
        .filter((r: any) => inRange(r.created_at)).length
    const totalRecords = (medicalRecordsData.value?.medical_records ?? [])
        .filter((r: any) => inRange(r.created_at)).length

    return [
        { name: `Monthly Visit Summary (${totalVisits} total)`, period: activePeriodLabel.value, generated: todayLabel, format: 'PDF' },
        { name: 'Doctor Performance Report', period: activePeriodLabel.value, generated: todayLabel, format: 'XLSX' },
        { name: `Department Utilization (${computedDeptLoad.value.length} depts)`, period: activePeriodLabel.value, generated: todayLabel, format: 'PDF' },
        { name: `Referral Activity Log (${totalReferrals} referrals)`, period: activePeriodLabel.value, generated: todayLabel, format: 'XLSX' },
        { name: `Medical Records Summary (${totalRecords} records)`, period: activePeriodLabel.value, generated: todayLabel, format: 'PDF' },
    ]
})
</script>

<template>
    <v-row>
        <v-col cols="12">
            <v-card-item class="pb-2 px-0 pt-0">
                <div class="d-flex justify-space-between align-center flex-wrap ga-3 mb-4">
                    <div>
                        <v-card-title class="text-h3">Reports</v-card-title>
                        <v-card-subtitle class="mt-1">
                            Overview of clinic activity — {{ activePeriodLabel }}
                        </v-card-subtitle>
                    </div>
                </div>

                <v-card elevation="0" border class="pa-3">
                    <div class="d-flex align-center gap-3 flex-wrap">
                        <v-btn-toggle v-model="filterMode" density="compact" variant="tonal" divided mandatory
                            color="primary">
                            <v-btn value="month" size="small" prepend-icon="mdi-calendar-month">
                                Month
                            </v-btn>
                            <v-btn value="range" size="small" prepend-icon="mdi-calendar-range">
                                Date Range
                            </v-btn>
                        </v-btn-toggle>

                        <v-divider vertical class="mx-1" style="height: 36px;" />
                        <template v-if="filterMode === 'month'">
                            <v-select v-model="filterYear" :items="yearOptions" variant="outlined" density="compact"
                                hide-details style="max-width: 110px" />
                            <v-select v-model="filterMonth" :items="monthOptions" item-title="label" item-value="value"
                                variant="outlined" density="compact" hide-details style="max-width: 160px" />
                        </template>

                        <template v-else>
                            <v-text-field v-model="filterDateFrom" type="date" label="From" variant="outlined"
                                density="compact" hide-details style="max-width: 170px" />
                            <v-text-field v-model="filterDateTo" type="date" label="To" variant="outlined"
                                density="compact" hide-details style="max-width: 170px" />
                        </template>

                        <v-btn variant="text" size="small" density="comfortable" icon="mdi-refresh"
                            title="Reset to current month" @click="resetFilters" />
                    </div>
                </v-card>
            </v-card-item>
        </v-col>

        <v-col v-if="isLoading" cols="12" class="d-flex justify-center py-12">
            <v-progress-circular indeterminate color="primary" size="48" />
        </v-col>

        <template v-else>
            <v-col cols="12" sm="6" md="3" v-for="(card, i) in summaryCards" :key="i">
                <v-card elevation="0">
                    <v-card-text>
                        <div class="d-flex justify-space-between align-start">
                            <div>
                                <div class="text-caption text-medium-emphasis mb-1">{{ card.label }}</div>
                                <div class="text-h4 font-weight-bold">{{ card.value }}</div>
                                <v-chip v-if="card.trend !== '—'" :color="card.trendUp ? 'success' : 'error'"
                                    size="x-small" variant="tonal" class="mt-2">
                                    <v-icon :icon="card.trendUp ? 'mdi-trending-up' : 'mdi-trending-down'" size="12"
                                        class="mr-1" />
                                    {{ card.trend }}
                                </v-chip>
                                <span v-else class="text-caption text-medium-emphasis mt-2 d-block">
                                    vs. previous period
                                </span>
                            </div>
                            <v-avatar :color="card.color" variant="tonal" size="44">
                                <v-icon :icon="card.icon" size="22" />
                            </v-avatar>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="7">
                <v-card elevation="0" class="h-100">
                    <v-card-item>
                        <v-card-title class="text-h5">Monthly Visits</v-card-title>
                        <v-card-subtitle>Total appointments per month — {{ filterYear }}</v-card-subtitle>
                    </v-card-item>
                    <v-card-text>
                        <ClientOnly>
                            <apexchart type="bar" height="300" :options="visitsChartOptions"
                                :series="visitsChartSeries" />
                        </ClientOnly>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="5">
                <v-card elevation="0" class="h-100">
                    <v-card-item>
                        <v-card-title class="text-h5">Department Load</v-card-title>
                        <v-card-subtitle>Share of appointments per department — {{ activePeriodLabel
                            }}</v-card-subtitle>
                    </v-card-item>
                    <v-card-text>
                        <template v-if="departmentChartSeries.length">
                            <ClientOnly>
                                <apexchart type="donut" height="300" :options="departmentChartOptions"
                                    :series="departmentChartSeries" />
                            </ClientOnly>
                        </template>
                        <div v-else class="d-flex align-center justify-center" style="height: 300px;">
                            <div class="text-center text-medium-emphasis">
                                <v-icon icon="mdi-chart-donut" size="48" class="mb-2 d-block" />
                                <span class="text-body-2">No appointments in this period</span>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="5">
                <v-card elevation="0" class="h-100">
                    <v-card-item>
                        <v-card-title class="text-h5">Top Diagnoses</v-card-title>
                        <v-card-subtitle>Most frequent diagnoses — {{ activePeriodLabel }}</v-card-subtitle>
                    </v-card-item>
                    <v-divider />
                    <template v-if="topDiagnoses.length">
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
                    </template>
                    <div v-else class="pa-6 text-center text-medium-emphasis text-body-2">
                        No diagnosis data for this period.
                    </div>
                </v-card>
            </v-col>

            <v-col cols="12" md="7">
                <v-card elevation="0" class="h-100">
                    <v-card-item>
                        <div class="d-flex justify-space-between align-center">
                            <div>
                                <v-card-title class="text-h5">Generated Reports</v-card-title>
                                <v-card-subtitle>Based on live clinic data — {{ activePeriodLabel }}</v-card-subtitle>
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
        </template>
    </v-row>
</template>