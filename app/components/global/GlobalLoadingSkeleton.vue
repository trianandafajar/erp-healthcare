<template>
  <v-app>
    <NuxtLoadingIndicator color="#176D37" :height="4" />
    <v-main class="d-flex align-center justify-center" style="min-height:100vh;background:#fafafb">
      <div class="loading-spinner" />
    </v-main>
  </v-app>
</template>

<style scoped>
.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e0e0e0;
  border-top-color: #176D37;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>