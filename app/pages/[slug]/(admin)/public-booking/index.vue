<script setup lang="ts">
import PublicBookingPage from '~/components/pages/admin/PublicBookingPage.vue'

definePageMeta({
    layout: 'default',
    middleware: ['auth', 'permission'],
    permissions: ['public-booking.view'],
})
</script>

<template>
    <PublicBookingPage />
</template>
