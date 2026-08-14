<script setup lang="ts">
import CalendarAppointments from '~/components/doctor/Appointment/CalendarAppointments.vue'

definePageMeta({
    layout: 'doctor',
    middleware: ['authorize'],
    permissions: ['appointment.view'],
})
</script>

<template>
    <CalendarAppointments />
</template>
