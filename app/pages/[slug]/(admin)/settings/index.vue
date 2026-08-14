<script setup lang="ts">
import SettingsPage from '~/components/pages/admin/SettingsPage.vue';

definePageMeta({
    layout: 'default',
    middleware: ['authorize'],
    roles: ['admin'],
})

useSeoMeta({
    title: 'Settings',
})

</script>

<template>
    <settings-page />
</template>