<script setup lang="ts">
import PharmacyVerification from '~/components/pharmacy/PharmacyVerification.vue'

definePageMeta({
    layout: 'pharmacy',
    middleware: ['auth', 'role'],
    role: 'pharmacy',
})
</script>

<template>
    <PharmacyVerification />
</template>
