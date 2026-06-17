<script setup lang="ts">
type NurseVitalRecord = {
    blood_pressure: string
    temperature: string | number | null
    pulse: string | number | null
    recorded_at: string
}

const props = defineProps<{
    vitals: NurseVitalRecord[]
    loading: boolean
}>()

const chartOptions = computed(() => ({
    chart: {
        type: 'line',
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'inherit',
    },
    stroke: {
        curve: 'smooth',
        width: [3, 3],
    },
    colors: ['#2563eb', '#f59e0b'],
    dataLabels: { enabled: false },
    xaxis: {
        categories: props.vitals.slice(0, 8).map((item) => new Date(item.recorded_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })),
    },
    yaxis: {
        labels: { style: { colors: '#64748b' } },
    },
    legend: {
        position: 'top',
        horizontalAlign: 'left',
    },
    grid: {
        borderColor: '#e5e7eb',
    },
    tooltip: {
        shared: true,
    },
}))

const chartSeries = computed(() => [
    {
        name: 'Heart Rate',
        data: props.vitals.slice(0, 8).map((item) => Number(item.pulse ?? 0)),
    },
    {
        name: 'Temperature',
        data: props.vitals.slice(0, 8).map((item) => Number(item.temperature ?? 0)),
    },
])
</script>

<template>
    <v-card elevation="0" class="mt-6">
        <v-card-item class="pb-2">
            <v-card-title class="text-h5">Vital Trend</v-card-title>
            <v-card-subtitle>Latest heart rate and temperature snapshot</v-card-subtitle>
        </v-card-item>
        <v-divider />
        <v-card-text>
            <template v-if="loading">
                <v-skeleton-loader type="image" />
            </template>
            <template v-else>
                <apexchart type="line" height="280" :options="chartOptions" :series="chartSeries" />
            </template>
        </v-card-text>
    </v-card>
</template>
