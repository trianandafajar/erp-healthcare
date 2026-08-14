<script setup lang="ts">
import TableReceptionist from '~/components/dashboard/receptionists/TableReceptionist.vue';

definePageMeta({
    layout: 'default',
    middleware: ['authorize'],
    roles: ['admin'],
    permissions: ['receptionist.view'],
})

useSeoMeta({
    title: 'Receptionist Management',
    ogTitle: 'Receptionist Management',
    description: 'Manage receptionist staff accounts and profiles.',
})
</script>

<template>
    <TableReceptionist />
</template>
