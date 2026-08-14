<script setup lang="ts">
import TableSchedule from '~/components/doctor/schedule/TableSchedule.vue';


definePageMeta({
    layout: 'doctor',
    middleware: ['authorize'],
    permissions: ['schedule.view'],
})

useSeoMeta({
    title: 'Schedule',
    ogTitle: 'My Amazing Site',
    description: 'This is my amazing site, let me tell you all about it.',
    ogDescription: 'This is my amazing site, let me tell you all about it.',
    ogImage: 'https://example.com/image.png',
    twitterCard: 'summary_large_image',
})

</script>

<template>
    <TableSchedule />
</template>