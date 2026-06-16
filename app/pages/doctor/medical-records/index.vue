<script setup lang="ts">
import TableMedicalRecord from '~/components/doctor/medicalRecord/TableMedicalRecord.vue';


definePageMeta({
    layout: 'doctor',
    middleware: 'auth'
})

useSeoMeta({
    title: 'Medical Record Page',
    ogTitle: 'My Amazing Site',
    description: 'This is my amazing site, let me tell you all about it.',
    ogDescription: 'This is my amazing site, let me tell you all about it.',
    ogImage: 'https://example.com/image.png',
    twitterCard: 'summary_large_image',
})

</script>

<template>
    <TableMedicalRecord />
</template>