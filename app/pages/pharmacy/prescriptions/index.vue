<script setup lang="ts">
import PharmacyPrescriptions from '~/components/pharmacy/PharmacyPrescriptions.vue'

definePageMeta({
    layout: 'pharmacy',
    middleware: ['auth', 'role'],
    role: 'pharmacy',
    permissions: ['prescriptions.view'],
})
</script>

<template>
    <PharmacyPrescriptions />
</template>
