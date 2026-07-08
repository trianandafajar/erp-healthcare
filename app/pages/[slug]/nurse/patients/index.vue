<script setup lang="ts">
import NursePatientList from '~/components/nurse/NursePatientList.vue'

definePageMeta({
    layout: 'nurse',
    middleware: ['auth', 'role', 'permission', 'plan'],
    role: 'nurse',
    requiredFeature: 'nurse_module',
    permissions: ['patient.view'],
})

useSeoMeta({
    title: 'Patient List',
    ogTitle: 'Patient List',
    description: 'Patients currently monitored by the nurse team.',
})
</script>

<template>
    <NursePatientList />
</template>
