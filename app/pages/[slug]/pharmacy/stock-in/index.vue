<script setup lang="ts">
import PharmacyStockMovement from '~/components/pharmacy/PharmacyStockMovement.vue'

definePageMeta({
    layout: 'pharmacy',
    middleware: ['authorize'],
    role: 'pharmacy',
    requiredFeature: 'pharmacy_module',
    permissions: ['stock-in.view'],
})

useSeoMeta({
    title: 'Stock In',
    ogTitle: 'My Amazing Site',
    description: 'This is my amazing site, let me tell you all about it.',
    ogDescription: 'This is my amazing site, let me tell you all about it.',
    ogImage: 'https://example.com/image.png',
    twitterCard: 'summary_large_image',
})
</script>

<template>
    <PharmacyStockMovement type="Incoming" />
</template>
