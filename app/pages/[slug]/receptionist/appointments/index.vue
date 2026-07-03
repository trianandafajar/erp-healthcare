<script setup lang="ts">
import ReceptionistAppointments from '~/components/receptionist/ReceptionistAppointments.vue'

definePageMeta({
    layout: 'receptionist',
    middleware: ['auth', 'permission'],
    role: 'receptionist',
    permissions: ['appointment.view'],
})

useSeoMeta({
    title: 'Receptionist Appointments',
    description: 'Manage patient appointments from the receptionist workspace.',
})
</script>

<template>
    <ReceptionistAppointments />
</template>
