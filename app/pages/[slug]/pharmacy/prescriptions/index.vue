<script setup lang="ts">
import PharmacyPrescriptions from '~/components/pharmacy/PharmacyPrescriptions.vue'

definePageMeta({
    layout: 'pharmacy',
    middleware: ['authorize'],
    role: 'pharmacy',
    requiredFeature: 'pharmacy_module',
    permissions: ['prescriptions.view'],
})

useSeoMeta({
    title: 'Prescriptions',
    ogTitle: 'My Amazing Site',
    description: 'This is my amazing site, let me tell you all about it.',
    ogDescription: 'This is my amazing site, let me tell you all about it.',
    ogImage: 'https://example.com/image.png',
    twitterCard: 'summary_large_image',
})

</script>

<template>
    <PharmacyPrescriptions />
</template>
