<script setup lang="ts">
import ReceptionistCheckIn from '~/components/receptionist/ReceptionistCheckIn.vue'

definePageMeta({
    layout: 'receptionist',
    middleware: ['authorize'],
    role: 'receptionist',
    permissions: ['check-in.view'],
})

useSeoMeta({
    title: 'Patient Check-in',
    description: 'Check in scheduled patients and create queue numbers.',
})
</script>

<template>
    <ReceptionistCheckIn />
</template>
