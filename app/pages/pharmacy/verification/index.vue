<script setup lang="ts">
import PharmacyVerification from '~/components/pharmacy/PharmacyVerification.vue'

definePageMeta({
    layout: 'pharmacy',
    middleware: ['auth', 'role', 'permission'],
    role: 'pharmacy',
    permissions: ['verification.view'],
})
</script>

<template>
    <PharmacyVerification />
</template>
