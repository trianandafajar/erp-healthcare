<script setup lang="ts">
import DashboardCharts from '~/components/dashboard/DashboardCharts.vue';
import WidgetFive from '~/components/dashboard/WidgetFive.vue';

definePageMeta({
    layout: 'default',
    middleware: 'auth'
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
    <WidgetFive />

    <DashboardCharts />
</template>