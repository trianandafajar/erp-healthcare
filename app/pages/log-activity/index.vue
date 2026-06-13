<script setup lang="ts">
import TableLog from '~/components/dashboard/LogActivity/TableLog.vue';


definePageMeta({
    layout: 'default',
    middleware: 'auth'
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