<script setup lang="ts">
import PublicBookingPage from '~/components/pages/admin/PublicBookingPage.vue'

definePageMeta({
    layout: 'default',
    middleware: ['authorize'],
    roles: ['admin'],
    permissions: ['public-booking.view'],
})
</script>

<template>
    <PublicBookingPage />
</template>
