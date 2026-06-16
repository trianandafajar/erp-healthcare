<script setup lang="ts">
import NursePatientList from '~/components/nurse/NursePatientList.vue'

definePageMeta({
    layout: 'nurse',
    middleware: ['auth', 'role'],
    role: 'nurse',
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
