<script setup lang="ts">
import NurseMonitoring from '~/components/nurse/NurseMonitoring.vue'

definePageMeta({
    layout: 'nurse',
    middleware: ['authorize'],
    role: 'nurse',
    requiredFeature: 'nurse_module',
    permissions: ['monitoring.view'],
})

useSeoMeta({
    title: 'Patient Monitoring',
    ogTitle: 'Patient Monitoring',
    description: 'Monitoring status for patients under observation.',
})
</script>

<template>
    <NurseMonitoring />
</template>
