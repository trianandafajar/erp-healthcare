<script setup lang="ts">
import TableNurse from '~/components/dashboard/nurses/TableNurse.vue';

definePageMeta({
    layout: 'default',
    middleware: ['auth', 'permission'],
    permissions: ['nurse.view'],
})

useSeoMeta({
    title: 'Nurses Management Page',
    ogTitle: 'My Amazing Site',
    description: 'This is my amazing site, let me tell you all about it.',
    ogDescription: 'This is my amazing site, let me tell you all about it.',
    ogImage: 'https://example.com/image.png',
    twitterCard: 'summary_large_image',
})
</script>

<template>
    <TableNurse />
</template>