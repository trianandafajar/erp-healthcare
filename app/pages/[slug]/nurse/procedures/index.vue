<script setup lang="ts">
import NurseProcedureSchedule from '~/components/nurse/NurseProcedureSchedule.vue'

definePageMeta({
    layout: 'nurse',
    middleware: ['authorize'],
    role: 'nurse',
    requiredFeature: 'nurse_module',
    permissions: ['procedures.view'],
})

useSeoMeta({
    title: 'Procedure Schedule',
    ogTitle: 'Procedure Schedule',
    description: 'Procedure and treatment schedule for monitored patients.',
})
</script>

<template>
    <NurseProcedureSchedule />
</template>
