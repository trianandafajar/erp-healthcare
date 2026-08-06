<script setup lang="ts">
import CalendarAppointments from '~/components/doctor/Appointment/CalendarAppointments.vue'

definePageMeta({
    layout: 'doctor',
    middleware: ['auth', 'permission'],
    permissions: ['appointment.view'],
})
</script>

<template>
    <CalendarAppointments />
</template>
