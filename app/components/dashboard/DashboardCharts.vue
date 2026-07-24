<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from 'vuetify'

const theme = useTheme()

const { data } = await useFetch<{
  roleCounts: Record<string, { label: string, count: number }>
}>('/api/dashboard/stats')

const { data: appointmentGrowth } =
  await useFetch<{
    months: string[]
    series: number[]
    total: number
  }>('/api/dashboard/monthly-appointments')


const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const appointmentSeries = computed(() => [
  {
    name: 'Appointments',
    data: appointmentGrowth.value?.series ?? []
  }
])

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
    categories: appointmentGrowth.value?.months ?? [],
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

function hexToHsl(hex: string) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16) / 255
  const g = parseInt(h.substring(2, 4), 16) / 255
  const b = parseInt(h.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h2 = 0
  let s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h2 = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h2 = ((b - r) / d + 2) / 6
    else h2 = ((r - g) / d + 4) / 6
  }

  return { h: h2 * 360, s: s * 100, l: l * 100 }
}

function hslToHex(h: number, s: number, l: number) {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

function generatePalette(baseHex: string, count = 6): string[] {
  const { h, s } = hexToHsl(baseHex)
  const clampedS = Math.min(Math.max(s, 45), 85)
  const lightnessSteps = [65, 58, 51, 44, 38, 32]
  return lightnessSteps.slice(0, count).map((l) =>
    hslToHex(h, clampedS, l)
  )
}

const profileStore = useProfileStore()
const roleColors = computed(() => generatePalette(profileStore.data?.tenant?.brand_color || '#176D37'))

const usersByRoleOptions = computed(() => ({
  chart: {
    type: 'donut',
    fontFamily: `inherit`,
  },
  labels: usersByRoleLabels.value,
  colors: roleColors.value,
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
      <v-card elevation="0" variant="outlined" :style="{ borderColor: '#e0e0e0' }" class="h-100">
        <v-card elevation="0" class="h-100">
          <v-card-item>
            <v-card-title class="text-h5">
              Monthly Appointments
            </v-card-title>

            <v-card-subtitle>
              Total {{ appointmentGrowth?.total ?? 0 }} appointments this year
            </v-card-subtitle>
          </v-card-item>
          <v-card-text>
            <ClientOnly>
              <apexchart type="area" height="300" :options="patientsGrowthOptions" :series="appointmentSeries" />
            </ClientOnly>
          </v-card-text>
        </v-card>
      </v-card>
    </v-col>

    <v-col cols="12" md="5">
      <v-card elevation="0" variant="outlined" :style="{ borderColor: '#e0e0e0' }" class="h-100">
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
      </v-card>
    </v-col>
  </v-row>
</template>