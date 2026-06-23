<script setup lang="ts">
import PharmacyDispensing from '~/components/pharmacy/PharmacyDispensing.vue'

definePageMeta({
    layout: 'pharmacy',
    middleware: ['auth', 'role', 'permission'],
    role: 'pharmacy',
    permissions: ['dispensing.view'],
})
</script>

<template>
    <PharmacyDispensing />
</template>
