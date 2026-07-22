<script setup lang="ts">
import TablePharmacy from '~/components/dashboard/pharmacies/TablePharmacy.vue';

definePageMeta({
    layout: 'default',
    middleware: ['auth', 'permission'],
    permissions: ['pharmacy.view'],
})

useSeoMeta({
    title: 'Pharmacy Management',
    ogTitle: 'Pharmacy Management',
    description: 'Manage pharmacy staff accounts and profiles.',
})
</script>

<template>
    <TablePharmacy />
</template>
