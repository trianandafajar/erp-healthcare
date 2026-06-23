<script setup lang="ts">
import ReceptionistDashboard from '~/components/receptionist/ReceptionistDashboard.vue'

definePageMeta({
    layout: 'receptionist',
    middleware: ['auth', 'permission'],
    role: 'receptionist',
    permissions: ['dashboard.view'],
})

useSeoMeta({
    title: 'Receptionist Dashboard',
    description: 'Overview of receptionist daily operations.',
})
</script>

<template>
    <ReceptionistDashboard />
</template>
