<script setup lang="ts">
const APP_NAME = 'Healthcare'
const DEFAULT_DESCRIPTION = 'Healthcare management platform for appointments, medical records, pharmacy, billing, and operations.'

useHead({
  titleTemplate: (title) => {
    const normalizedTitle = typeof title === 'string' ? title.trim() : ''
    return normalizedTitle ? `${normalizedTitle} | ${APP_NAME}` : APP_NAME
  },
})

useSeoMeta({
  ogSiteName: APP_NAME,
  applicationName: APP_NAME,
  description: DEFAULT_DESCRIPTION,
  ogDescription: DEFAULT_DESCRIPTION,
})
</script>

<template>
  <NuxtLoadingIndicator color="#176D37" :height="4" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
