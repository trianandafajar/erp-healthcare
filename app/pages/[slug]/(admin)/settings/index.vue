<script setup lang="ts">
import SettingsPage from '~/components/pages/admin/SettingsPage.vue';

definePageMeta({
    layout: 'default',
    middleware: ['auth'],
})

useSeoMeta({
    title: 'Settings',
})

</script>

<template>
    <settings-page />
</template>