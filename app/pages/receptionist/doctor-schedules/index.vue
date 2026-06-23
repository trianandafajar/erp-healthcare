<script setup lang="ts">
import ReceptionistDoctorSchedules from '~/components/receptionist/ReceptionistDoctorSchedules.vue'

definePageMeta({
    layout: 'receptionist',
    middleware: ['auth', 'role'],
    role: 'receptionist',
    permissions: ['schedule.view'],
})

useSeoMeta({
    title: 'Doctor Schedules',
    description: 'Review doctor schedules and availability from the receptionist workspace.',
})
</script>

<template>
    <ReceptionistDoctorSchedules />
</template>
