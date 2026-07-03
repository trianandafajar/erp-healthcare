<script setup lang="ts">
import NurseCareNotes from '~/components/nurse/NurseCareNotes.vue'

definePageMeta({
    layout: 'nurse',
    middleware: ['auth', 'role', 'permission'],
    role: 'nurse',
    permissions: ['care-notes.view'],
})

useSeoMeta({
    title: 'Care Notes',
    ogTitle: 'Care Notes',
    description: 'Patient observation and care action notes.',
})
</script>

<template>
    <NurseCareNotes />
</template>
