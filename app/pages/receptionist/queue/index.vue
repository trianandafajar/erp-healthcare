<script setup lang="ts">
import ReceptionistQueue from '~/components/receptionist/ReceptionistQueue.vue'

definePageMeta({
    layout: 'receptionist',
    middleware: ['auth', 'role'],
    role: 'receptionist',
})

useSeoMeta({
    title: 'Patient Queue',
    description: 'Manage patient queue from the receptionist workspace.',
})
</script>

<template>
    <ReceptionistQueue />
</template>
