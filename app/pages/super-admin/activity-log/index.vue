<script setup lang="ts">
import TableLog from '~/components/dashboard/LogActivity/TableLog.vue';


definePageMeta({
    layout: 'superadmin',
    middleware: ['auth', 'permission'],
    permissions: ['log.view'],
})

useSeoMeta({
    title: 'Log Activity Page',
    ogTitle: 'My Amazing Site',
    description: 'This is my amazing site, let me tell you all about it.',
    ogDescription: 'This is my amazing site, let me tell you all about it.',
    ogImage: 'https://example.com/image.png',
    twitterCard: 'summary_large_image',
})
</script>

<template>
    <TableLog />
</template>