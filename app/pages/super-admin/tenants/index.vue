<script setup lang="ts">
import TableTenants from '~/components/dashboard/superadmin/TableTenants.vue'

definePageMeta({
  layout: 'superadmin',
  middleware: ['authorize'],
})

useSeoMeta({
  title: 'Tenants Management',
  ogTitle: 'Tenants Management',
  description: 'Manage all registered tenants and their subscriptions',
  ogDescription: 'Manage all registered tenants and their subscriptions',
})
</script>

<template>
  <TableTenants />
</template>
