<script setup lang="ts">
import ReceptionistBilling from '~/components/receptionist/ReceptionistBilling.vue'

definePageMeta({
    layout: 'receptionist',
    middleware: ['auth', 'role'],
    role: 'receptionist',
})

useSeoMeta({
    title: 'Receptionist Billing',
    description: 'Manage patient billing from the receptionist workspace.',
})
</script>

<template>
    <ReceptionistBilling />
</template>
