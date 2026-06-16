<script setup lang="ts">
import PharmacyDispensing from '~/components/pharmacy/PharmacyDispensing.vue'

definePageMeta({
    layout: 'pharmacy',
    middleware: ['auth', 'role'],
    role: 'pharmacy',
})
</script>

<template>
    <PharmacyDispensing />
</template>
