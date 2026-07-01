<script setup lang="ts">
import TableIndustries from '~/components/dashboard/landingpage/TableIndustries.vue'

definePageMeta({
    layout: 'default',
    middleware: ['auth', 'permission'],
    permissions: ['landingpage.industries.view'],
})

useSeoMeta({
    title: 'Industries Management',
})
</script>

<template>
    <TableIndustries />
</template>
