<script setup lang="ts">
import TablePricingPlans from '~/components/dashboard/landingpage/TablePricingPlans.vue'

definePageMeta({
    layout: 'superadmin',
    middleware: ['authorize'],
    permissions: ['landingpage.pricing.view'],
})

useSeoMeta({
    title: 'Pricing Plans Management',
    ogTitle: 'Pricing Plans Management',
    description: 'Manage pricing plans displayed on the landing page',
    ogDescription: 'Manage pricing plans displayed on the landing page',
})
</script>

<template>
    <TablePricingPlans />
</template>
