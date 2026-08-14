<script setup lang="ts">
import ReceptionistPatientRegistration from '~/components/receptionist/ReceptionistPatientRegistration.vue'

definePageMeta({
    layout: 'receptionist',
    middleware: ['authorize'],
    role: 'receptionist',
    permissions: ['patient-regist.view'],
})

useSeoMeta({
    title: 'Patient Registration',
    description: 'Register and search patients from the receptionist workspace.',
})
</script>

<template>
    <ReceptionistPatientRegistration />
</template>
