<script setup lang="ts">
import ReceptionistDashboard from '~/components/receptionist/ReceptionistDashboard.vue'

definePageMeta({
    layout: 'receptionist',
    middleware: ['auth', 'role'],
    role: 'receptionist',
})

useSeoMeta({
    title: 'Receptionist Dashboard',
    description: 'Overview of receptionist daily operations.',
})
</script>

<template>
    <ReceptionistDashboard />
</template>
