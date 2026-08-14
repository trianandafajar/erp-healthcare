<script setup lang="ts">
import TableSubscriptions from '~/components/dashboard/superadmin/TableSubscriptions.vue'

definePageMeta({
  layout: 'superadmin',
  middleware: ['authorize'],
})

useSeoMeta({
  title: 'Subscriptions Management',
  ogTitle: 'Subscriptions Management',
  description: 'Manage subscription plans and tenant assignments',
  ogDescription: 'Manage subscription plans and tenant assignments',
})
</script>

<template>
  <TableSubscriptions />
</template>
