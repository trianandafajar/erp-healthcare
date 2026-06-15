<script setup lang="ts">
import TableUser from '~/components/dashboard/users/TableUser.vue';

definePageMeta({
    layout: 'default',
    middleware: 'auth'
})

useSeoMeta({
    title: 'User Management Page',
    ogTitle: 'My Amazing Site',
    description: 'This is my amazing site, let me tell you all about it.',
    ogDescription: 'This is my amazing site, let me tell you all about it.',
    ogImage: 'https://example.com/image.png',
    twitterCard: 'summary_large_image',
})
</script>

<template>
    <TableUser />
</template>