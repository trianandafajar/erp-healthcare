<script setup lang="ts">
import TableDepartments from '~/components/dashboard/departments/TableDepartments.vue';

definePageMeta({
    layout: 'default',
    middleware: ['auth', 'permission'],
    permissions: ['department.view'],
})

useSeoMeta({
    title: 'Departments Management Page',
    ogTitle: 'My Amazing Site',
    description: 'This is my amazing site, let me tell you all about it.',
    ogDescription: 'This is my amazing site, let me tell you all about it.',
    ogImage: 'https://example.com/image.png',
    twitterCard: 'summary_large_image',
})
</script>

<template>
    <TableDepartments />
</template>