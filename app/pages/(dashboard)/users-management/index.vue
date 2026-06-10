<script setup lang="ts">
import TableUser from '~/components/dashboard/users/tableUser.vue';

definePageMeta({
    layout: 'default',
    middleware: 'auth'
})
</script>

<template>
    <TableUser />
</template>