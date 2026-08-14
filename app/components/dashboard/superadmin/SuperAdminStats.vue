<script setup lang="ts">
import { computed } from 'vue'
import { RiseOutlined, FallOutlined, TeamOutlined, UserOutlined, ShoppingCartOutlined, PlusCircleOutlined, BuildOutlined } from '@ant-design/icons-vue'

const dummyStats = {
  totalTenants: 12,
  totalUsers: 1247,
  activeSubscriptions: 10,
  newThisMonth: 3,
  totalIndustries: 8,
}

const growthPercent = '25.0%'
const isGrowth = true

const stats = computed(() => [
  {
    name: 'Total Tenants',
    earn: dummyStats.totalTenants.toLocaleString(),
    percent: growthPercent,
    color: 'primary',
    icon: isGrowth ? RiseOutlined : FallOutlined,
    text: `${dummyStats.newThisMonth} new this month`,
    to: '/super-admin/tenants',
  },
  {
    name: 'Total Users',
    earn: dummyStats.totalUsers.toLocaleString(),
    percent: null,
    color: 'success',
    icon: null,
    text: 'Across all tenants',
    to: '/super-admin/users-management',
  },
  {
    name: 'Active Subs',
    earn: dummyStats.activeSubscriptions.toLocaleString(),
    percent: null,
    color: 'warning',
    icon: null,
    text: `${(dummyStats.activeSubscriptions / dummyStats.totalTenants * 100).toFixed(0)}% of tenants`,
    to: '/super-admin/subscriptions',
  },
  {
    name: 'New This Month',
    earn: dummyStats.newThisMonth.toLocaleString(),
    percent: null,
    color: 'secondary',
    icon: null,
    text: 'Tenants registered',
    to: '/super-admin/tenants',
  },
  {
    name: 'Total Articles',
    earn: dummyStats.totalIndustries.toLocaleString(),
    percent: null,
    color: 'info',
    icon: null,
    text: 'Landing page articles',
    to: '/super-admin/landingpage/industries',
  },
])
</script>

<template>
  <v-row class="my-0">
    <v-col cols="6" sm="4" md="" v-for="(card, i) in stats" :key="i" :style="{ flex: '1 1 0' }" class="flex-grow-1">
      <v-card :to="card.to" elevation="0">
      <v-card elevation="0" variant="outlined" :style="{ borderColor: '#e0e0e0' }">
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
      </v-card>
    </v-col>
  </v-row>
</template>
