<script setup lang="ts">
import NurseVitalSigns from '~/components/nurse/NurseVitalSigns.vue'

definePageMeta({
    layout: 'nurse',
    middleware: ['auth', 'role'],
    role: 'nurse',
    permissions: ['vitals.view'],
})

useSeoMeta({
    title: 'Vital Sign Entry',
    ogTitle: 'Vital Sign Entry',
    description: 'Enter blood pressure, temperature, weight, height, and pulse.',
})
</script>

<template>
    <NurseVitalSigns />
</template>
