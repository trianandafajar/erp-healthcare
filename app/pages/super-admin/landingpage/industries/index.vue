<script setup lang="ts">
import TableIndustries from '~/components/dashboard/landingpage/TableIndustries.vue'

definePageMeta({
    layout: 'superadmin',
    middleware: ['authorize'],
    permissions: ['landingpage.industries.view'],
})

useSeoMeta({
    title: 'Industries Management',
})
</script>

<template>
    <TableIndustries />
</template>
