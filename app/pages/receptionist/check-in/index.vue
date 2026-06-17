<script setup lang="ts">
import ReceptionistCheckIn from '~/components/receptionist/ReceptionistCheckIn.vue'

definePageMeta({
    layout: 'receptionist',
    middleware: ['auth', 'role'],
    role: 'receptionist',
})

useSeoMeta({
    title: 'Patient Check-in',
    description: 'Check in scheduled patients and create queue numbers.',
})
</script>

<template>
    <ReceptionistCheckIn />
</template>
