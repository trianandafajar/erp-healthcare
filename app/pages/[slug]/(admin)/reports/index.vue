<script setup lang="ts">
import Reportpage from '~/components/pages/admin/ReportPage.vue';

definePageMeta({
    layout: 'default',
    middleware: ['auth', 'permission', 'plan'],
    permissions: ['report.view'],
    requiredFeature: 'reports',
})

</script>

<template>
    <Reportpage />
</template>