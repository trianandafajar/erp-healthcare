<script setup lang="ts">
import TableContactInquiries from '~/components/dashboard/superadmin/TableContactInquiries.vue'

definePageMeta({
    layout: 'superadmin',
    middleware: ['auth'],
})

useSeoMeta({
    title: 'Contact Inquiries',
    ogTitle: 'Contact Inquiries',
    description: 'Manage and respond to contact inquiries from the landing page.',
    ogDescription: 'Manage and respond to contact inquiries from the landing page.',
})
</script>

<template>
    <TableContactInquiries />
</template>
