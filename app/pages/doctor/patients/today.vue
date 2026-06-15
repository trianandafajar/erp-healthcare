<script setup lang="ts">
import TableAppoint from '~/components/doctor/Appointment/TableAppoint.vue';


definePageMeta({
    layout: 'doctor',
    middleware: 'auth'
})

useSeoMeta({
    title: 'Appointment Page',
    ogTitle: 'My Amazing Site',
    description: 'This is my amazing site, let me tell you all about it.',
    ogDescription: 'This is my amazing site, let me tell you all about it.',
    ogImage: 'https://example.com/image.png',
    twitterCard: 'summary_large_image',
})

</script>

<template>
    <TableAppoint />
</template>