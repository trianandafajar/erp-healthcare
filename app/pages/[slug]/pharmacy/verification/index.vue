<script setup lang="ts">
import PharmacyVerification from '~/components/pharmacy/PharmacyVerification.vue'

definePageMeta({
    layout: 'pharmacy',
    middleware: ['authorize'],
    role: 'pharmacy',
    requiredFeature: 'pharmacy_module',
    permissions: ['verification.view'],
})

useSeoMeta({
    title: 'Verification',
    ogTitle: 'My Amazing Site',
    description: 'This is my amazing site, let me tell you all about it.',
    ogDescription: 'This is my amazing site, let me tell you all about it.',
    ogImage: 'https://example.com/image.png',
    twitterCard: 'summary_large_image',
})

</script>

<template>
    <PharmacyVerification />
</template>
