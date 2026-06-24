<script setup lang="ts">
import { shallowRef } from 'vue'

const year = new Date().getFullYear()

const footerLink = shallowRef([
  { title: 'About us' },
  { title: 'Privacy' },
  { title: 'Terms' }
])
</script>

<template>
  <v-footer class="px-0 footer" color="containerbg">
    <v-row justify="center" no-gutters>
      <v-col cols="6">
        <p class="text-caption mb-0">
          © {{ year }} All rights reserved
          <a href="/" class="text-primary">Privacy Policy</a>. Distributed by
          <a href="#" target="_blank" rel="noopener noreferrer" class="text-primary">HealthData</a>
        </p>
      </v-col>
      <v-col class="text-right" cols="6">
        <a v-for="(item, i) in footerLink" :key="i" class="mx-2 text-caption text-darkText" href="#!">
          {{ item.title }}
        </a>
      </v-col>
    </v-row>
  </v-footer>
</template>