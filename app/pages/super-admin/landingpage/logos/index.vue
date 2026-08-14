<script setup lang="ts">
import TableLogos from '~/components/dashboard/landingpage/TableLogos.vue'

definePageMeta({
    layout: 'superadmin',
    middleware: ['authorize'],
    // permissions: ['landingpage.logos.view'],
})

useSeoMeta({
    title: 'Logo Management',
    ogTitle: 'Logo Management',
    description: 'Manage client logos displayed on the landing page',
    ogDescription: 'Manage client logos displayed on the landing page',
})
</script>

<template>
    <TableLogos />
</template>
