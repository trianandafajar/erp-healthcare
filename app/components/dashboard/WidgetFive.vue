<script setup lang="ts">
import { RiseOutlined, FallOutlined } from '@ant-design/icons-vue';

const { data } = await useFetch<{ profiles: any[] }>('/api/users')

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

const fivecards = computed(() => [
    {
        name: 'Total Users',
        earn: totalUsers.value.toLocaleString(),
        percent: growthPercent.value,
        color: isGrowth.value ? 'primary' : 'error',
        icon: isGrowth.value ? RiseOutlined : FallOutlined,
        text: thisMonthUsers.value.toLocaleString()
    },
    {
        name: 'Total Page Views',
        earn: '4,42,236',
        percent: '59.3%',
        color: 'success',
        icon: RiseOutlined,
        text: '35,000'
    },
    {
        name: 'Total Order',
        earn: '18,800',
        percent: '27.4%',
        color: 'warning',
        icon: FallOutlined,
        text: '1,943'
    },
    {
        name: 'Total Sales',
        earn: '$35,078',
        percent: '27.4%',
        color: 'error',
        icon: FallOutlined,
        text: '$20,395'
    }
]);
</script>

<template>
    <v-row class="my-0">
        <v-col cols="12" sm="6" md="3" v-for="(card5, i) in fivecards" :key="i" :value="card5">
            <v-card elevation="0">
                <v-card>
                    <v-card-text>
                        <div class="d-flex align-items-center justify-space-between">
                            <div>
                                <h6 class="text-h6 text-lightText mb-1">{{ card5.name }}</h6>
                                <h4 class="text-h4 d-flex align-center mb-0">
                                    {{ card5.earn }}
                                    <v-chip :color="card5.color" :border="`${card5.color} solid thin opacity-50`"
                                        class="ml-2" size="small" label>
                                        <template v-slot:prepend>
                                            <component :is="card5.icon" :style="{ fontSize: '12px' }"
                                                :class="'mr-1 text-' + card5.color" />
                                        </template>
                                        {{ card5.percent }}
                                    </v-chip>
                                </h4>
                                <span class="text-lightText text-caption pt-5 d-block">
                                    <span :class="'text-' + card5.color">{{ card5.text }}</span> new users this month
                                </span>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-card>
        </v-col>
    </v-row>
</template>
