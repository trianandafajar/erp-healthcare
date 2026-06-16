<script setup lang="ts">
import PharmacyStockMovement from '~/components/pharmacy/PharmacyStockMovement.vue'

definePageMeta({
    layout: 'pharmacy',
    middleware: ['auth', 'role'],
    role: 'pharmacy',
})
</script>

<template>
    <PharmacyStockMovement type="Outgoing" />
</template>
