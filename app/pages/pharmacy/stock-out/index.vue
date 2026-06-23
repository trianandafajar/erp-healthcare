<script setup lang="ts">
import PharmacyStockMovement from '~/components/pharmacy/PharmacyStockMovement.vue'

definePageMeta({
    layout: 'pharmacy',
    middleware: ['auth', 'role', 'permission'],
    role: 'pharmacy',
    permissions: ['stock-out.view'],
})
</script>

<template>
    <PharmacyStockMovement type="Outgoing" />
</template>
