<script setup lang="ts">
import TableTestimonials from '~/components/dashboard/landingpage/TableTestimonials.vue'

definePageMeta({
    layout: 'superadmin',
    middleware: ['authorize'],
    permissions: ['landingpage.testimonials.view'],
})

useSeoMeta({
    title: 'Testimonial Management',
    ogTitle: 'Testimonial Management',
    description: 'Manage customer testimonials displayed on the landing page',
    ogDescription: 'Manage customer testimonials displayed on the landing page',
})
</script>

<template>
    <TableTestimonials />
</template>
