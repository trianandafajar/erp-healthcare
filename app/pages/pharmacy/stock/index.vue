<script setup lang="ts">
import PharmacyStock from '~/components/pharmacy/PharmacyStock.vue'

definePageMeta({
    layout: 'pharmacy',
    middleware: ['auth', 'role', 'permission'],
    role: 'pharmacy',
    permissions: ['stock.view'],
})
</script>

<template>
    <PharmacyStock />
</template>
