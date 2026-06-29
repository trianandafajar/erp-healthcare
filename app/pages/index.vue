<script setup lang="ts">
definePageMeta({
    layout: 'blank',
    middleware: 'auth'
})

useSeoMeta({
    title: 'Home',
    ogTitle: 'My Amazing Site',
    description: 'This is my amazing site, let me tell you all about it.',
    ogDescription: 'This is my amazing site, let me tell you all about it.',
    ogImage: 'https://example.com/image.png',
    twitterCard: 'summary_large_image',
})

</script>
<template>
    Calon Landing Page
</template>