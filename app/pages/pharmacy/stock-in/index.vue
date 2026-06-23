<script setup lang="ts">
import PharmacyStockMovement from '~/components/pharmacy/PharmacyStockMovement.vue'

definePageMeta({
    layout: 'pharmacy',
    middleware: ['auth', 'role'],
    role: 'pharmacy',
    permissions: ['stock-in.view'],
})
</script>

<template>
    <PharmacyStockMovement type="Incoming" />
</template>
