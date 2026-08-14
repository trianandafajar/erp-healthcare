<script setup lang="ts">
import Reportpage from '~/components/pages/admin/ReportPage.vue';

definePageMeta({
    layout: 'default',
    middleware: ['authorize'],
    roles: ['admin'],
    permissions: ['report.view'],
    requiredFeature: 'reports',
})

</script>

<template>
    <Reportpage />
</template>