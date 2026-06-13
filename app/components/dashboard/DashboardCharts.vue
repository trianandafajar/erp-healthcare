<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from 'vuetify'

const theme = useTheme()

const { data } = await useFetch<{
  roleCounts: Record<string, { label: string, count: number }>
}>('/api/dashboard/stats')

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const patientsGrowthDummy = [12, 19, 15, 25, 22, 30, 28, 35, 32, 40, 38, 45]

const patientsGrowthSeries = [
  {
    name: 'New Patients',
    data: patientsGrowthDummy
  }
]

const patientsGrowthOptions = computed(() => ({
  chart: {
    type: 'area',
    toolbar: { show: false },
    fontFamily: `inherit`,
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
      stops: [0, 100]
    }
  },
  xaxis: {
    categories: months,
    axisBorder: { show: false },
  },
  yaxis: { show: true },
  grid: {
    strokeDashArray: 4,
  },
  tooltip: {
    theme: 'light'
  }
}))

const roleEntries = computed(() => Object.values(data.value?.roleCounts ?? {}))

const usersByRoleSeries = computed(() => roleEntries.value.map(r => r.count))
const usersByRoleLabels = computed(() => roleEntries.value.map(r => r.label))

const roleColors = [
  '#1677ff',
  '#52c41a',
  '#722ed1',
  '#13c2c2',
  '#faad14',
  '#f5222d',
]

const usersByRoleOptions = computed(() => ({
  chart: {
    type: 'donut',
    fontFamily: `inherit`,
  },
  labels: usersByRoleLabels.value,
  colors: roleColors,
  legend: {
    position: 'bottom',
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number) => `${val.toFixed(0)}%`
  },
  plotOptions: {
    pie: {
      donut: {
        size: '65%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Total Users',
            formatter: (w: any) => w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)
          }
        }
      }
    }
  },
  tooltip: {
    theme: 'light'
  }
}))

const totalRoleUsers = computed(() => usersByRoleSeries.value.reduce((a, b) => a + b, 0))
</script>

<template>
  <v-row class="my-0" align="stretch">
    <v-col cols="12" md="7">
      <v-card elevation="0" class="h-100">
        <v-card-item>
          <v-card-title class="text-h5">Patients Growth</v-card-title>
          <v-card-subtitle>Sample data — monthly new patients</v-card-subtitle>
        </v-card-item>
        <v-card-text>
          <ClientOnly>
            <apexchart type="area" height="300" :options="patientsGrowthOptions" :series="patientsGrowthSeries" />
          </ClientOnly>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" md="5">
      <v-card elevation="0" class="h-100">
        <v-card-item>
          <v-card-title class="text-h5">Users by Role</v-card-title>
          <v-card-subtitle>Distribution of {{ totalRoleUsers }} total users</v-card-subtitle>
        </v-card-item>
        <v-card-text>
          <ClientOnly>
            <div v-if="usersByRoleSeries.length === 0" class="text-center py-8 text-medium-emphasis">
              <v-icon icon="mdi-account-group-outline" size="32" class="mb-2 d-block mx-auto" />
              No role data available
            </div>
            <apexchart v-else type="donut" height="300" :options="usersByRoleOptions" :series="usersByRoleSeries" />
          </ClientOnly>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>