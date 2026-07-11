<script setup lang="ts">
import DashboardPage from '~/components/pages/admin/DashboardPage.vue';

definePageMeta({
    layout: 'default',
    middleware: ['auth', 'permission'],
    permissions: ['dashboard.view'],
})

useSeoMeta({
    title: 'Dashboard Page',
    ogTitle: 'My Amazing Site',
    description: 'This is my amazing site, let me tell you all about it.',
    ogDescription: 'This is my amazing site, let me tell you all about it.',
    ogImage: 'https://example.com/image.png',
    twitterCard: 'summary_large_image',
})
</script>

<template>
    <DashboardPage />
</template>