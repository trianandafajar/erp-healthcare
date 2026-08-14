<script setup lang="ts">
import TableRole from '~/components/dashboard/roles/TableRole.vue';


definePageMeta({
    layout: 'default',
    middleware: ['authorize'],
    roles: ['admin'],
    permissions: ['role.view'],
})

useSeoMeta({
    title: 'Roles Management Page',
    ogTitle: 'My Amazing Site',
    description: 'This is my amazing site, let me tell you all about it.',
    ogDescription: 'This is my amazing site, let me tell you all about it.',
    ogImage: 'https://example.com/image.png',
    twitterCard: 'summary_large_image',
})
</script>

<template>
    <TableRole />
</template>