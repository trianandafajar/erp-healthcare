<script setup lang="ts">
import SuperAdminStats from '~/components/dashboard/superadmin/SuperAdminStats.vue'
import SuperAdminCharts from '~/components/dashboard/superadmin/SuperAdminCharts.vue'
import SuperAdminTenantsTable from '~/components/dashboard/superadmin/SuperAdminTenantsTable.vue'

definePageMeta({
  layout: 'superadmin',
  middleware: ['auth'],
})

useSeoMeta({
  title: 'Superadmin Dashboard',
  ogTitle: 'Superadmin Dashboard',
  description: 'Overview of all tenants and system activity',
  ogDescription: 'Overview of all tenants and system activity',
})
</script>

<template>
  <v-card elevation="0">
    <v-card elevation="0">
      <v-card-text>
        <div class="text-h5 font-weight-bold">Superadmin Dashboard</div>
        <div class="text-caption text-medium-emphasis">Overview of all tenants and system activity</div>
      </v-card-text>
    </v-card>
  </v-card>

  <SuperAdminStats />
  <SuperAdminCharts />
  <SuperAdminTenantsTable />
</template>
