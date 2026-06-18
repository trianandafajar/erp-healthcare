<script setup lang="ts">
import TablePermissions from '~/components/dashboard/permissions/TablePermissions.vue';

definePageMeta({
    layout: 'default',
    middleware: ['auth', 'permission'],
    permissions: ['permission.view'],
})

useSeoMeta({
    title: 'Permissions Management Page',
    ogTitle: 'My Amazing Site',
    description: 'This is my amazing site, let me tell you all about it.',
    ogDescription: 'This is my amazing site, let me tell you all about it.',
    ogImage: 'https://example.com/image.png',
    twitterCard: 'summary_large_image',
})
</script>

<template>
    <TablePermissions />
</template>