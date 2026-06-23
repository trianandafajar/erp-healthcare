<script setup lang="ts">
definePageMeta({
    layout: 'default',
    middleware: ['auth', 'permission'],
    permissions: ['report.view'],
})

const { data: statsData, pending: statsPending } = await useFetch('/api/dashboard/stats')
const { data: monthlyData, pending: monthlyPending } = await useFetch('/api/dashboard/monthly-appointments')
const { data: appointmentsData, pending: appointmentsPending } = await useFetch('/api/appointments')
const { data: medicalRecordsData, pending: recordsPending } = await useFetch('/api/doctor/medical-records')
const { data: departmentsData, pending: deptPending } = await useFetch('/api/departments')
const { data: referralsData, pending: referralsPending } = await useFetch('/api/doctor/referrals/made')

const isLoading = computed(() =>
    statsPending.value || monthlyPending.value || appointmentsPending.value ||
    recordsPending.value || deptPending.value || referralsPending.value
)

const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth()
const monthStart = new Date(currentYear, currentMonth, 1)

const summaryCards = computed(() => {
    const allAppointments = appointmentsData.value?.appointments ?? []
    const allReferrals = referralsData.value?.referrals ?? []
    const allRecords = medicalRecordsData.value?.medical_records ?? []

    const visitsThisMonth = allAppointments.filter((a: any) => {
        const d = new Date(a.appointment_date)
        return d >= monthStart && d.getFullYear() === currentYear
    })

    const newPatientIds = new Set(
        visitsThisMonth.map((a: any) => a.patient?.id).filter(Boolean)
    )

    const referralsThisMonth = allReferrals.filter((r: any) => {
        const d = new Date(r.created_at)
        return d >= monthStart && d.getFullYear() === currentYear
    })

    const prescriptionsThisMonth = allRecords.filter((r: any) => {
        const d = new Date(r.created_at)
        return d >= monthStart && d.getFullYear() === currentYear
    })

    const prevMonthStart = new Date(currentYear, currentMonth - 1, 1)
    const prevMonthEnd = new Date(currentYear, currentMonth, 0)
    const visitsPrevMonth = allAppointments.filter((a: any) => {
        const d = new Date(a.appointment_date)
        return d >= prevMonthStart && d <= prevMonthEnd
    })
    const referralsPrevMonth = allReferrals.filter((r: any) => {
        const d = new Date(r.created_at)
        return d >= prevMonthStart && d <= prevMonthEnd
    })

    const calcTrend = (current: number, prev: number) => {
        if (prev === 0) return { text: '+100%', up: true }
        const pct = ((current - prev) / prev) * 100
        return {
            text: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
            up: pct >= 0
        }
    }

    const visitsTrend = calcTrend(visitsThisMonth.length, visitsPrevMonth.length)
    const referralsTrend = calcTrend(referralsThisMonth.length, referralsPrevMonth.length)

    return [
        {
            label: 'Total Visits (This Month)',
            value: visitsThisMonth.length.toString(),
            icon: 'mdi-calendar-check',
            color: 'primary',
            trend: visitsTrend.text,
            trendUp: visitsTrend.up
        },
        {
            label: 'New Patients',
            value: newPatientIds.size.toString(),
            icon: 'mdi-account-plus-outline',
            color: 'success',
            trend: '—',
            trendUp: true
        },
        {
            label: 'Referrals Made',
            value: referralsThisMonth.length.toString(),
            icon: 'mdi-share-variant-outline',
            color: 'secondary',
            trend: referralsTrend.text,
            trendUp: referralsTrend.up
        },
        {
            label: 'Medical Records (This Month)',
            value: prescriptionsThisMonth.length.toString(),
            icon: 'mdi-file-document-outline',
            color: 'warning',
            trend: '—',
            trendUp: true
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

const departmentChartOptions = computed(() => {
    const deptLoad = computedDeptLoad.value
    return {
        chart: { type: 'donut', fontFamily: 'inherit' },
        labels: deptLoad.map((d: any) => d.name),
        colors: ['#1677ff', '#52c41a', '#722ed1', '#13c2c2', '#faad14', '#ff4d4f', '#fa8c16'],
        legend: { position: 'bottom' },
        dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(0)}%` },
        tooltip: { theme: 'light' },
        noData: { text: 'No data available' },
    }
})

const computedDeptLoad = computed(() => {
    const allAppointments = appointmentsData.value?.appointments ?? []
    const deptList = departmentsData.value?.departments ?? []

    if (!allAppointments.length || !deptList.length) return []

    const deptCount: Record<string, { name: string; count: number }> = {}

    for (const appt of allAppointments) {
        const deptName = appt.department?.name ?? appt.doctor?.department?.[0]?.name
        if (!deptName) continue
        if (!deptCount[deptName]) deptCount[deptName] = { name: deptName, count: 0 }
        deptCount[deptName].count++
    }

    return Object.values(deptCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, 7)
})

const departmentChartSeries = computed(() => computedDeptLoad.value.map((d: any) => d.count))

const topDiagnoses = computed(() => {
    const records = medicalRecordsData.value?.medical_records ?? []
    const diagCount: Record<string, number> = {}

    for (const rec of records) {
        const diag = rec.diagnosis
        if (!diag) continue
        const key = diag.trim()
        diagCount[key] = (diagCount[key] ?? 0) + 1
    }

    return Object.entries(diagCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count], i) => ({ rank: i + 1, name, count }))
})

const reportTableHeaders = ['Report', 'Period', 'Generated', 'Format']
const currentMonthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
const todayLabel = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

const availableReports = computed(() => {
    const totalVisits = (appointmentsData.value?.appointments ?? []).length
    const totalReferrals = (referralsData.value?.referrals ?? []).length
    const totalRecords = (medicalRecordsData.value?.medical_records ?? []).length

    return [
        { name: `Monthly Visit Summary (${totalVisits} total)`, period: currentMonthLabel, generated: todayLabel, format: 'PDF' },
        { name: 'Doctor Performance Report', period: 'Q2 2026', generated: todayLabel, format: 'XLSX' },
        { name: `Department Utilization (${computedDeptLoad.value.length} depts)`, period: currentMonthLabel, generated: todayLabel, format: 'PDF' },
        { name: `Referral Activity Log (${totalReferrals} referrals)`, period: currentMonthLabel, generated: todayLabel, format: 'XLSX' },
        { name: `Medical Records Summary (${totalRecords} records)`, period: currentMonthLabel, generated: todayLabel, format: 'PDF' },
    ]
})
</script>

<template>
    <v-row>
        <v-col cols="12">
            <v-card-item class="pb-2 px-0 pt-0">
                <div class="d-flex justify-space-between align-center flex-wrap ga-3">
                    <div>
                        <v-card-title class="text-h3">Reports</v-card-title>
                        <v-card-subtitle class="mt-1">
                            Overview of clinic activity — live data
                        </v-card-subtitle>
                    </div>
                </div>
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
                                <span v-else class="text-caption text-medium-emphasis mt-2 d-block">vs. last
                                    month</span>
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
                        <v-card-subtitle>Total appointments per month — {{ currentYear }}</v-card-subtitle>
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
                        <v-card-subtitle>Share of appointments per department (all-time)</v-card-subtitle>
                    </v-card-item>
                    <v-card-text>
                        <template v-if="departmentChartSeries.length">
                            <ClientOnly>
                                <apexchart type="donut" height="300" :options="departmentChartOptions"
                                    :series="departmentChartSeries" />
                            </ClientOnly>
                        </template>
                        <div v-else class="d-flex align-center justify-center" style="height: 300px;">
                            <v-icon icon="mdi-chart-donut" size="48" color="medium-emphasis" />
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
            <v-col cols="12" md="5">
                <v-card elevation="0" class="h-100">
                    <v-card-item>
                        <v-card-title class="text-h5">Top Diagnoses</v-card-title>
                        <v-card-subtitle>Most frequent diagnoses from all medical records</v-card-subtitle>
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
                        No diagnosis data available yet.
                    </div>
                </v-card>
            </v-col>
            <v-col cols="12" md="7">
                <v-card elevation="0" class="h-100">
                    <v-card-item>
                        <div class="d-flex justify-space-between align-center">
                            <div>
                                <v-card-title class="text-h5">Generated Reports</v-card-title>
                                <v-card-subtitle>Based on live clinic data</v-card-subtitle>
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