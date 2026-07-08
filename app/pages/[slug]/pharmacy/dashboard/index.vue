<script setup lang="ts">
import PharmacyDashboard from '~/components/pharmacy/PharmacyDashboard.vue'

definePageMeta({
    layout: 'pharmacy',
    middleware: ['auth', 'role', 'permission', 'plan'],
    role: 'pharmacy',
    requiredFeature: 'pharmacy_module',
    permissions: ['dashboard.view'],
})

useSeoMeta({
    title: 'Pharmacy Dashboard',
    ogTitle: 'Pharmacy Dashboard',
    description: 'Overview of pharmacy prescription and stock operations.',
    ogDescription: 'Overview of pharmacy prescription and stock operations.',
    twitterCard: 'summary_large_image',
})

</script>

<template>
    <PharmacyDashboard />
</template>
