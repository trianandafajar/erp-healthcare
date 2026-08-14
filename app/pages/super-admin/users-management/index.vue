<script setup lang="ts">
import TableUsersSuperadmin from '~/components/dashboard/superadmin/TableUsersSuperadmin.vue';

definePageMeta({
    layout: 'superadmin',
    middleware: ['authorize']
})

useSeoMeta({
    title: 'User Management - Super Admin',
})
</script>

<template>
    <TableUsersSuperadmin />
</template>
