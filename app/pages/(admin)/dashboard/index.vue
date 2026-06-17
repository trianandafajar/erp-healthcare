<script setup lang="ts">
import DashboardCharts from '~/components/dashboard/DashboardCharts.vue';
import RecentActivity from '~/components/dashboard/RecentActivity.vue';
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
    <v-card elevation="0">
        <v-card-text>
            <div class="text-h5 font-weight-bold">Admin Dashboard</div>
            <div class="text-caption text-medium-emphasis">Overview daily web activity</div>
        </v-card-text>
    </v-card>

    <WidgetFive />

    <DashboardCharts />

    <RecentActivity />
</template>