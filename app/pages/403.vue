<script setup lang="ts">
definePageMeta({
    layout: 'blank'
})
</script>

<template>
    <v-container class="d-flex flex-column align-center justify-center" style="min-height: 100vh;">
        <v-icon icon="mdi-lock-alert-outline" size="64" color="error" class="mb-4" />
        <h1 class="text-h3 font-weight-bold mb-2">Access Denied</h1>
        <p class="text-body-1 text-medium-emphasis mb-6 text-center" style="max-width: 400px;">
            You don't have permission to view this page. Contact your administrator if you believe this is a mistake.
        </p>
        <v-btn color="primary" variant="flat" to="/dashboard">
            Back to Dashboard
        </v-btn>
    </v-container>
</template>