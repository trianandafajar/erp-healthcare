<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from 'vuetify'

const theme = useTheme()

const dummyTenantGrowth = {
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  series: [1, 2, 1, 3, 2, 4, 3, 2, 3, 4, 2, 3],
  total: 30,
}

const dummySubscriptions = {
  Free: 5,
  Basic: 4,
  Pro: 2,
  Enterprise: 1,
}

const tenantSeries = computed(() => [
  {
    name: 'New Tenants',
    data: dummyTenantGrowth.series,
  },
])

const tenantGrowthOptions = computed(() => ({
  chart: {
    type: 'area',
    toolbar: { show: false },
    fontFamily: 'inherit',
  },
  colors: [theme.current.value.colors.primary],
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 2 },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.4,
      opacityTo: 0.05,
      stops: [0, 100],
    },
  },
  xaxis: {
    categories: dummyTenantGrowth.months,
    axisBorder: { show: false },
  },
  yaxis: { show: true },
  grid: {
    strokeDashArray: 4,
  },
  tooltip: {
    theme: 'light',
  },
}))

const subscriptionLabels = computed(() => Object.keys(dummySubscriptions))
const subscriptionSeries = computed(() => Object.values(dummySubscriptions))

const planColors = ['#52c41a', '#1677ff', '#722ed1', '#f5222d']

const subscriptionOptions = computed(() => ({
  chart: {
    type: 'donut',
    fontFamily: 'inherit',
  },
  labels: subscriptionLabels.value,
  colors: planColors,
  legend: {
    position: 'bottom',
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number) => `${val.toFixed(0)}%`,
  },
  plotOptions: {
    pie: {
      donut: {
        size: '65%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Total Plans',
            formatter: (w: any) => w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0),
          },
        },
      },
    },
  },
  tooltip: {
    theme: 'light',
  },
}))

const totalPlans = computed(() => subscriptionSeries.value.reduce((a, b) => a + b, 0))
</script>

<template>
  <v-row class="my-0" align="stretch">
    <v-col cols="12" md="7">
      <v-card elevation="0" class="h-100">
        <v-card-item>
          <v-card-title class="text-h5">Tenant Growth</v-card-title>
          <v-card-subtitle>
            {{ dummyTenantGrowth.total }} new tenants registered this year
          </v-card-subtitle>
        </v-card-item>
        <v-card-text>
          <ClientOnly>
            <apexchart type="area" height="300" :options="tenantGrowthOptions" :series="tenantSeries" />
          </ClientOnly>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" md="5">
      <v-card elevation="0" class="h-100">
        <v-card-item>
          <v-card-title class="text-h5">Subscription Plans</v-card-title>
          <v-card-subtitle>Distribution of {{ totalPlans }} total plans</v-card-subtitle>
        </v-card-item>
        <v-card-text>
          <ClientOnly>
            <div v-if="subscriptionSeries.length === 0" class="text-center py-8 text-medium-emphasis">
              <v-icon icon="mdi-chart-pie" size="32" class="mb-2 d-block mx-auto" />
              No subscription data available
            </div>
            <apexchart v-else type="donut" height="300" :options="subscriptionOptions" :series="subscriptionSeries" />
          </ClientOnly>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
