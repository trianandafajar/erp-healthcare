<script setup lang="ts">
import { computed } from 'vue'
import { RiseOutlined, FallOutlined } from '@ant-design/icons-vue';

const route = useRoute();
const slug = route.params.slug as string;

const { data } = await useFetch<{
    profiles: any[],
    stats: { patients: number, doctors: number, nurses: number, departments: number }
}>('/api/dashboard/stats')

const totalUsers = computed(() => data.value?.profiles?.length ?? 0)

const currentMonth = new Date().getMonth()
const currentYear = new Date().getFullYear()

const thisMonthUsers = computed(() =>
    data.value?.profiles?.filter(u => {
        const d = new Date(u.created_at)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    }).length ?? 0
)

const lastMonthUsers = computed(() => {
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
    return data.value?.profiles?.filter(u => {
        const d = new Date(u.created_at)
        return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear
    }).length ?? 0
})

const growthPercent = computed(() => {
    if (lastMonthUsers.value === 0) return thisMonthUsers.value > 0 ? '100%' : '0%'
    const growth = ((thisMonthUsers.value - lastMonthUsers.value) / lastMonthUsers.value) * 100
    return Math.abs(growth).toFixed(1) + '%'
})

const isGrowth = computed(() => thisMonthUsers.value >= lastMonthUsers.value)

const stats = computed(() => data.value?.stats ?? { patients: 0, doctors: 0, nurses: 0, departments: 0 })

const fivecards = computed(() => [
    {
        name: 'Total Users',
        earn: totalUsers.value.toLocaleString(),
        percent: growthPercent.value,
        color: isGrowth.value ? 'primary' : 'error',
        icon: isGrowth.value ? RiseOutlined : FallOutlined,
        text: thisMonthUsers.value.toLocaleString() + ' new users this month',
        to: `/${slug}/users-management`
    },
    {
        name: 'Total Patients',
        earn: stats.value.patients.toLocaleString(),
        percent: null,
        color: 'success',
        icon: null,
        text: 'Registered & walk-in',
        to: `/${slug}/patients`
    },
    {
        name: 'Total Doctors',
        earn: stats.value.doctors.toLocaleString(),
        percent: null,
        color: 'warning',
        icon: null,
        text: 'Active doctor profiles',
        to: `/${slug}/doctors`
    },
    {
        name: 'Total Nurses',
        earn: stats.value.nurses.toLocaleString(),
        percent: null,
        color: 'secondary',
        icon: null,
        text: 'Active nurse profiles',
        to: `/${slug}/nurses`
    },
    {
        name: 'Departments',
        earn: stats.value.departments.toLocaleString(),
        percent: null,
        color: 'info',
        icon: null,
        text: 'Poli / departments',
        to: `/${slug}/departments`
    }
]);
</script>

<template>
    <v-row class="my-0">
        <v-col cols="6" sm="4" md="" v-for="(card5, i) in fivecards" :key="i" :style="{ flex: '1 1 0' }"
            class="flex-grow-1">
            <v-card :to="card5.to" elevation="0" class="stat-card">
                <v-card-text>
                    <div class="d-flex align-items-center justify-space-between">
                        <div>
                            <h6 class="text-h6 text-lightText mb-1">{{ card5.name }}</h6>
                            <h4 class="text-h4 d-flex align-center mb-0">
                                {{ card5.earn }}
                                <v-chip v-if="card5.percent" :color="card5.color"
                                    :border="`${card5.color} solid thin opacity-50`" class="ml-2" size="small" label>
                                    <template v-slot:prepend>
                                            <component :is="card5.icon" :style="{ fontSize: '12px' }"
                                            :class="'mr-1 text-' + card5.color" />
                                    </template>
                                    {{ card5.percent }}
                                </v-chip>
                            </h4>
                            <span class="text-lightText text-caption pt-5 d-block">
                                {{ card5.text }}
                            </span>
                        </div>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>
</template>

<style scoped>
.stat-card.v-card--link:before {
  background: rgba(0, 0, 0, 0.04) !important;
}
.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06) !important;
}
</style>