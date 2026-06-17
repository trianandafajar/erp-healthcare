<script setup lang="ts">
import ReceptionistQueuePrint from '~/components/receptionist/ReceptionistQueuePrint.vue'

definePageMeta({
    layout: 'receptionist',
    middleware: ['auth', 'role'],
    role: 'receptionist',
})

useSeoMeta({
    title: 'Print Queue Number',
    description: 'Preview and print patient queue numbers.',
})
</script>

<template>
    <ReceptionistQueuePrint />
</template>
