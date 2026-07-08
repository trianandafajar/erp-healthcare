<script setup lang="ts">
import PharmacyDispensing from '~/components/pharmacy/PharmacyDispensing.vue'

definePageMeta({
    layout: 'pharmacy',
    middleware: ['auth', 'role', 'permission', 'plan'],
    role: 'pharmacy',
    requiredFeature: 'pharmacy_module',
    permissions: ['dispensing.view'],
})
useSeoMeta({
    title: 'Dispensing',
    ogTitle: 'My Amazing Site',
    description: 'This is my amazing site, let me tell you all about it.',
    ogDescription: 'This is my amazing site, let me tell you all about it.',
    ogImage: 'https://example.com/image.png',
    twitterCard: 'summary_large_image',
})
</script>


<template>
    <PharmacyDispensing />
</template>
