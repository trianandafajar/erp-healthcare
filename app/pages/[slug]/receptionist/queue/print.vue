<script setup lang="ts">
import ReceptionistQueuePrint from '~/components/receptionist/ReceptionistQueuePrint.vue'

definePageMeta({
    layout: 'receptionist',
    middleware: ['authorize'],
    role: 'receptionist',
    permissions: ['queue.view'],
})

useSeoMeta({
    title: 'Print Queue Number',
    description: 'Preview and print patient queue numbers.',
})
</script>

<template>
    <ReceptionistQueuePrint />
</template>
