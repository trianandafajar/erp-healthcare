<script setup lang="ts">
const consent = useCookieConsent()
consent.init()
</script>

<template>
  <div v-if="consent.show.value" class="cookie-bar">
    <div class="d-flex align-center ga-3 justify-center py-6 px-4 flex-wrap">
      <v-icon icon="mdi-cookie" size="20" color="primary" />
      <span class="text-body-2 text-darkText">
        We use cookies to enhance your experience. By continuing, you agree to the use of cookies.
      </span>
      <v-btn variant="flat" color="primary" size="small" class="flex-shrink-0" @click="consent.accept()">
        Accept
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.cookie-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  background-color: rgb(var(--v-theme-surface));
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}
</style>
