<script setup lang="ts">
import TableDoctors from '~/components/dashboard/doctors/TableDoctors.vue';

definePageMeta({
    layout: 'default',
    middleware: ['authorize'],
    roles: ['admin'],
    permissions: ['doctor.view'],
})

useSeoMeta({
    title: 'Doctors Management Page',
    ogTitle: 'My Amazing Site',
    description: 'This is my amazing site, let me tell you all about it.',
    ogDescription: 'This is my amazing site, let me tell you all about it.',
    ogImage: 'https://example.com/image.png',
    twitterCard: 'summary_large_image',
})
</script>

<template>
    <TableDoctors />
</template>