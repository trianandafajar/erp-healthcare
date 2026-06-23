<script setup lang="ts">
import NurseDashboard from '~/components/nurse/NurseDashboard.vue'

definePageMeta({
    layout: 'nurse',
    middleware: ['auth', 'role', 'permission'],
    role: 'nurse',
    permissions: ['dashboard.view'],
})

useSeoMeta({
    title: 'Nurse Dashboard',
    ogTitle: 'Nurse Dashboard',
    description: 'Overview of the nurse daily workflow and patient care.',
    ogDescription: 'Overview of the nurse daily workflow and patient care.',
    twitterCard: 'summary_large_image',
})
</script>

<template>
    <NurseDashboard />
</template>
