<script setup lang="ts">
import TableReferral from '~/components/doctor/referal/TableReferral.vue';



definePageMeta({
    layout: 'doctor',
    middleware: ['auth', 'permission'],
    permissions: ['referrals.view'],
})

useSeoMeta({
    title: 'Referral Page',
    ogTitle: 'My Amazing Site',
    description: 'This is my amazing site, let me tell you all about it.',
    ogDescription: 'This is my amazing site, let me tell you all about it.',
    ogImage: 'https://example.com/image.png',
    twitterCard: 'summary_large_image',
})

</script>

<template>
    <table-referral />
</template>