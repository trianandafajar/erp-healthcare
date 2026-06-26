<script setup lang="ts">
import { shallowRef } from 'vue'

const year = new Date().getFullYear()

const footerLink = shallowRef([
  { title: 'About us', to: '/legal?page=about' },
  { title: 'Privacy', to: '/legal?page=privacy' },
  { title: 'Terms', to: '/legal?page=terms' },
])
</script>

<template>
  <v-footer class="px-0 footer" color="containerbg">
    <v-row justify="center" no-gutters>
      <v-col cols="6">
        <p class="text-caption mb-0">
          © {{ year }} All rights reserved ·
          <NuxtLink to="/legal?page=privacy" class="text-primary">Privacy Policy</NuxtLink> ·
          Distributed by
          <a href="#" target="_blank" rel="noopener noreferrer" class="text-primary">HealthData</a>
        </p>
      </v-col>
      <v-col class="text-right" cols="6">
        <NuxtLink v-for="(item, i) in footerLink" :key="i" :to="item.to"
          class="mx-2 text-caption text-darkText text-decoration-none">
          {{ item.title }}
        </NuxtLink>
      </v-col>
    </v-row>
  </v-footer>
</template>