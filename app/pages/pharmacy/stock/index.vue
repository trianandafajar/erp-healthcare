<script setup lang="ts">
import PharmacyStock from '~/components/pharmacy/PharmacyStock.vue'

definePageMeta({
    layout: 'pharmacy',
    middleware: ['auth', 'role'],
    role: 'pharmacy',
})
</script>

<template>
    <PharmacyStock />
</template>
