<script setup lang="ts">
import TableExamination from '~/components/doctor/examination/TableExamination.vue';


definePageMeta({
    layout: 'doctor',
    middleware: ['authorize'],
    permissions: ['examination.view'],
})
useSeoMeta({
    title: 'Examination',
    ogTitle: 'My Amazing Site',
    description: 'This is my amazing site, let me tell you all about it.',
    ogDescription: 'This is my amazing site, let me tell you all about it.',
    ogImage: 'https://example.com/image.png',
    twitterCard: 'summary_large_image',
})

</script>

<template>
    <table-examination />
</template>