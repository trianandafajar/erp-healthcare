<script setup lang="ts">
import TableLog from '~/components/dashboard/LogActivity/TableLog.vue';

definePageMeta({
    layout: 'default',
    middleware: ['authorize'],
    roles: ['admin'],
})

useSeoMeta({
    title: 'Log Activity',
})

const authStore = useAuthStore()
const actorId = (authStore.user as any)?.id
</script>

<template>
    <TableLog :actor-id="actorId" />
</template>
