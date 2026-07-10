<script setup lang="ts">
const consent = useCookieConsent()
consent.init()
</script>

<template>
  <v-snackbar v-model="consent.show.value" location="bottom" :timeout="-1" color="surface" class="cookie-snackbar">
    <div class="d-flex align-center ga-3">
      <v-icon icon="mdi-cookie" size="20" color="primary" />
      <span class="text-body-2 text-darkText">
        We use cookies to enhance your experience. By continuing, you agree to the use of cookies.
      </span>
      <v-btn variant="flat" color="primary" size="small" class="flex-shrink-0" @click="consent.accept()">
        Accept
      </v-btn>
    </div>
  </v-snackbar>
</template>

<style scoped>
.cookie-snackbar {
  max-width: 720px;
  margin: 0 auto 8px;
  border-radius: 12px;
}

.cookie-snackbar :deep(.v-snackbar__wrapper) {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12) !important;
}

.cookie-snackbar :deep(.v-snackbar__content) {
  padding: 12px 20px;
}
</style>
